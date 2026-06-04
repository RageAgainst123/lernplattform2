'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { backfillPendingAnswers } from '@/lib/db/quiz-end-backfill';
import { checkQuizQuota, QUOTA_EXCEEDED_MESSAGE } from '@/lib/db/quiz-quota';
import { featureFlags, maintenanceMessages } from '@/lib/feature-flags';
import type { QuizMode, QuizQuestionRef, QuizSessionSettings } from '@/lib/schemas/quiz';

// Server Actions für die Quiz-Steuerung (Lehrer:innen-Seite, Phase S).
// Alle laufen hinter requireUser() über den User-Client mit RLS — die
// Policy quiz_sessions_all_own erzwingt, dass nur Sessions EIGENER Klassen
// geändert werden. Service-Role wird NICHT genutzt (das ist der
// Schüler:innen-Schreibpfad in quiz-participant-actions.ts).
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §5 (Live) + §6 (Homework).
// Pattern: identisch zu lib/db/live-session-actions.ts.

export type QuizActionState = { error: string | null };
export type CreateQuizSessionResult = QuizActionState & { sessionId: string | null };

// Mappt das RPC-Exception-Detail auf eine freundliche Nachricht für Geo.
// Der RPC start_quiz_session wirft `live_session_active` wenn eine
// Präsentation läuft — die App soll das sichtbar machen, damit Geo weiß
// was zu tun ist (Spec §3.11).
function rpcErrorMessage(message: string): string {
  if (message.includes('live_session_active')) {
    return 'Es läuft bereits eine Live-Präsentation in dieser Klasse — bitte erst beenden.';
  }
  return 'Quiz konnte nicht gestartet werden.';
}

// Legt eine neue Quiz-Session an. Beendet alte Sessions atomar (RPC
// start_quiz_session — partial unique index als Sicherheitsnetz) und prüft
// gegenseitige Sperre gegen Live-Präsentation. Liefert sessionId zurück
// (für Redirect auf Beamer-Lobby).
export async function createQuizSession(args: {
  classId: string;
  moduleId: string;
  mode: QuizMode;
  questionOrder: QuizQuestionRef[];
  settings: QuizSessionSettings;
}): Promise<CreateQuizSessionResult> {
  if (!featureFlags.isQuizEnabled()) {
    return { sessionId: null, error: maintenanceMessages.quiz.teacher };
  }
  const user = await requireUser();
  if (!args.classId || !args.moduleId) {
    return { sessionId: null, error: 'Klasse oder Modul fehlt.' };
  }
  // C4 (COST-CONTROLS.md L1.1): Tagespensum-Quota prüfen. Bei Erreichen
  // freundliche Fehlermeldung statt Bot-Schutz-500.
  const quota = await checkQuizQuota(args.classId);
  if (!quota.ok) {
    return { sessionId: null, error: QUOTA_EXCEEDED_MESSAGE };
  }
  // Spec §3.9: Live/Team/Homework-Modi filtern match-Blocks raus. Wenn
  // dadurch keine Frage übrig bleibt, lehnt der Setup-Pfad bereits hier ab
  // (statt der RPC eine leere Order zu schicken).
  if (args.questionOrder.length === 0) {
    return {
      sessionId: null,
      error: 'Keine bewertbaren Fragen vorhanden — Modul enthält nur Inhalt oder match-Blocks.',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('start_quiz_session', {
    p_class: args.classId,
    p_module: args.moduleId,
    p_mode: args.mode,
    p_question_order: args.questionOrder,
    p_time_limit_seconds: args.settings.timeLimitSeconds,
    p_scoring_time_limit_s: args.settings.scoringTimeLimitS,
    p_team_mode: args.settings.teamMode || args.mode === 'team',
    p_show_leaderboard: args.settings.showLeaderboardBetween,
    p_shuffle_questions: args.settings.shuffleQuestions,
    p_shuffle_answers: args.settings.shuffleAnswers,
    p_due_date: args.settings.dueDate,
    p_started_by: user.id,
  });
  if (error) {
    return { sessionId: null, error: rpcErrorMessage(error.message) };
  }
  revalidatePath(`/lehrer/klassen/${args.classId}`);
  return { sessionId: (data as string | null) ?? null, error: null };
}

// Lobby → Active. Beamer ruft das auf wenn alle Teilnehmer:innen da sind
// und „Quiz starten" geklickt wird. Setzt current_question_index zurück
// auf 0 (defensive — RPC tut das schon) und stempelt
// current_question_started_at für die Punkte-Formel.
export async function startQuiz(classId: string): Promise<QuizActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      status: 'active',
      current_question_index: 0,
      current_question_started_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    })
    .eq('class_id', classId)
    .eq('status', 'lobby');
  if (error) {
    return { error: 'Quiz konnte nicht gestartet werden.' };
  }
  return { error: null };
}

// Beendet die laufende Quiz-Session der Klasse (Beamer-Tab klickt „Quiz
// beenden" oder Heartbeat-Tod via Lazy-Check). Lässt 'ended'-Rows für die
// Auswertung in der DB stehen.
//
// Phase S4 (Spec §5.7): Vor dem Status-Wechsel werden pending answers für
// alle bis dahin erreichten Fragen (0..currentQuestionIndex) mit 0 Punkten
// gefüllt — damit das Leaderboard fair zählt: wer nicht geantwortet hat,
// bekommt 0 statt „existiert nicht". Backfill nur wenn Status active oder
// between_questions war (aus Lobby beendet = noch keine Frage erreicht).
export async function endQuizSession(classId: string): Promise<QuizActionState> {
  await requireUser();
  const supabase = await createClient();

  // Zuerst die laufende Session laden — wir brauchen current_question_index,
  // question_order und status, um zu wissen ob/wie viel zu backfillen ist.
  const { data: sessionRow } = await supabase
    .from('quiz_sessions')
    .select('id, status, current_question_index, question_order')
    .eq('class_id', classId)
    .in('status', ['lobby', 'active', 'between_questions'])
    .maybeSingle();

  if (sessionRow) {
    const status = sessionRow.status as string;
    const sessionId = sessionRow.id as string;
    const currentIdx = sessionRow.current_question_index as number;
    const order = sessionRow.question_order as Array<{ blockId: string }>;
    if (status !== 'lobby') {
      await backfillPendingAnswers(sessionId, order, currentIdx);
    }
  }

  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('class_id', classId)
    .in('status', ['lobby', 'active', 'between_questions']);
  if (error) {
    return { error: 'Quiz konnte nicht beendet werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Reveal: active → between_questions. Lehrer:in klickt „Auflösen" am
// Beamer. Schüler:innen-Wartezeit-Page wechselt automatisch.
// current_question_started_at bleibt stehen (Lazy-Default-Insert nutzt
// es weiter falls noch jemand nicht geantwortet hat).
export async function revealQuizQuestion(classId: string): Promise<QuizActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('quiz_sessions')
    .update({ status: 'between_questions', heartbeat_at: new Date().toISOString() })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) return { error: 'Auflösen fehlgeschlagen.' };
  return { error: null };
}

// Nächste Frage: between_questions → active, current_question_index++.
// Wenn schon am Ende der question_order angekommen → endQuizSession.
export async function nextQuizQuestion(classId: string): Promise<QuizActionState> {
  await requireUser();
  const supabase = await createClient();
  // Aktuellen Stand lesen — current_question_index + question_order-Länge.
  const { data: row } = await supabase
    .from('quiz_sessions')
    .select('current_question_index, question_order')
    .eq('class_id', classId)
    .eq('status', 'between_questions')
    .maybeSingle();
  if (!row) return { error: 'Kein wartendes Quiz gefunden.' };
  const nextIndex = (row.current_question_index as number) + 1;
  const total = Array.isArray(row.question_order) ? (row.question_order as unknown[]).length : 0;
  if (nextIndex >= total) {
    // Keine Frage mehr — beenden.
    return endQuizSession(classId);
  }
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      status: 'active',
      current_question_index: nextIndex,
      current_question_started_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    })
    .eq('class_id', classId)
    .eq('status', 'between_questions');
  if (error) return { error: 'Nächste Frage konnte nicht geladen werden.' };
  return { error: null };
}

// Beamer-Tab pingt regelmäßig (alle 30 s, siehe S1.D Hook). Ohne Heartbeat
// nach 120 s gilt die Session als tot (Spec §11 D10).
export async function heartbeatQuizSession(classId: string): Promise<QuizActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('quiz_sessions')
    .update({ heartbeat_at: new Date().toISOString() })
    .eq('class_id', classId)
    .in('status', ['lobby', 'active', 'between_questions']);
  if (error) {
    return { error: 'Heartbeat fehlgeschlagen.' };
  }
  return { error: null };
}
