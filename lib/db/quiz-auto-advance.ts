import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { backfillPendingAnswers } from '@/lib/db/quiz-end-backfill';

// Auto-Reveal-Trigger (Spec §11 Punkt 12 + §5.9). Wechselt die Session
// automatisch in 'between_questions' wenn:
//   a) ALLE Teilnehmer:innen geantwortet haben (Lehrer:in muss nicht mehr
//      manuell „Auflösen" klicken), ODER
//   b) Das Zeitlimit der Frage + 5s Karenz abgelaufen ist (Spec sagt 30s
//      bei Disconnect; wir nehmen time_limit + 5s als „Frage ist um" weil
//      der eigentliche Frage-Timer ohnehin schon scoring_time_limit_s lang
//      war).
//
// Pattern: idempotent + Race-frei via WHERE-Klausel im UPDATE. Wenn
// jemand parallel reveal klickt oder ein anderer Submit auto-advance
// auslöst, gewinnt der erste (status='active' wird zu 'between_questions',
// zweiter UPDATE matched die WHERE-Klausel nicht mehr).
//
// Aufruf-Stellen:
//   • submitQuizAnswer (nach Insert, prüft auf „alle geantwortet")
//   • /api/quiz/question (vor Lesen, prüft auf Timeout-Karenz)
//   • /api/quiz/beamer (vor Lesen, prüft auf Timeout-Karenz)

const TIMEOUT_GRACE_MS = 5 * 1000;

type SessionSnapshot = {
  id: string;
  status: string;
  current_question_index: number;
  current_question_started_at: string | null;
  time_limit_seconds: number;
  question_order: Array<{ blockId: string }>;
};

// Reine Pure-Helper-Funktion: gegeben Session-Daten + answeredCount +
// participantCount + nowMs, gibt zurück ob auto-advanced werden soll und
// wenn ja aus welchem Grund. Testbar isoliert.
export type AutoAdvanceReason = 'all_answered' | 'timeout' | null;

export function decideAutoAdvance(args: {
  status: string;
  startedAtIso: string | null;
  timeLimitSeconds: number;
  answeredCount: number;
  participantCount: number;
  nowMs: number;
}): AutoAdvanceReason {
  if (args.status !== 'active') return null;
  if (args.participantCount === 0) return null;
  if (args.answeredCount >= args.participantCount) return 'all_answered';
  if (args.startedAtIso) {
    const elapsed = args.nowMs - new Date(args.startedAtIso).getTime();
    if (elapsed > args.timeLimitSeconds * 1000 + TIMEOUT_GRACE_MS) return 'timeout';
  }
  return null;
}

// Hauptfunktion: liest aktuelle Session, entscheidet ob auto-advance, und
// triggert ggf. Backfill + Status-Update. Gibt 'advanced' zurück damit
// Caller weiß: hier ist gerade ein Reveal passiert (z.B. damit der
// /api/quiz/question-Endpoint sofort die neue between-Response liefern
// kann ohne extra Polling-Tick).
export async function maybeAdvanceQuiz(
  classId: string
): Promise<{ advanced: boolean; reason: AutoAdvanceReason }> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('quiz_sessions')
    .select(
      'id, status, current_question_index, current_question_started_at, time_limit_seconds, question_order'
    )
    .eq('class_id', classId)
    .in('status', ['active'])
    .maybeSingle();
  if (!data) return { advanced: false, reason: null };
  const sess = data as SessionSnapshot;

  const counts = await loadAnsweredAndParticipantCounts(
    supabase,
    sess.id,
    sess.current_question_index
  );
  const reason = decideAutoAdvance({
    status: sess.status,
    startedAtIso: sess.current_question_started_at,
    timeLimitSeconds: sess.time_limit_seconds,
    answeredCount: counts.answered,
    participantCount: counts.participants,
    nowMs: Date.now(),
  });
  if (!reason) return { advanced: false, reason: null };

  // Bei Timeout: Backfill für die verpassenden Teilnehmer:innen, damit das
  // Leaderboard sauber zählt (sonst tauchen sie als „kein Eintrag" auf
  // statt als „0 Punkte richtig zugeordnet").
  if (reason === 'timeout') {
    await backfillPendingAnswers(sess.id, sess.question_order, sess.current_question_index);
  }

  // Race-frei: nur updaten wenn Status noch 'active' ist. Wenn ein
  // paralleler Aufruf bereits 'between_questions' gesetzt hat, matched
  // die WHERE-Klausel nicht und wir tun nichts.
  await supabase
    .from('quiz_sessions')
    .update({
      status: 'between_questions',
      heartbeat_at: new Date().toISOString(),
    })
    .eq('id', sess.id)
    .eq('status', 'active');

  return { advanced: true, reason };
}

async function loadAnsweredAndParticipantCounts(
  supabase: ReturnType<typeof createServiceClient>,
  sessionId: string,
  questionIndex: number
): Promise<{ answered: number; participants: number }> {
  const [ansRes, partRes] = await Promise.all([
    supabase
      .from('quiz_answers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex),
    supabase
      .from('quiz_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId),
  ]);
  return {
    answered: ansRes.count ?? 0,
    participants: partRes.count ?? 0,
  };
}
