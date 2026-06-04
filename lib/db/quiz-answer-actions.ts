'use server';

import { requireStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { evaluateBlock, type BlockAnswer } from '@/lib/blocks/evaluate';
import { calculatePoints } from '@/lib/blocks/points';
import type { Block } from '@/lib/schemas/blocks';
import { moduleContentSchema } from '@/lib/schemas/blocks';

// Schüler:innen-Schreibpfad für Quiz-Antworten (Phase S2.A).
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §5.4.
//
// Atomare Operation:
//   1. Session laden + validieren (active + richtiger question_index)
//   2. Modul-Content laden + Block finden + Antwort bewerten
//   3. Participant laden (current_streak für Bonus-Berechnung)
//   4. Punkte berechnen (calculatePoints — Spec §8)
//   5. INSERT quiz_answers (UNIQUE-Constraint = Doppel-Submit-Schutz)
//   6. UPDATE quiz_participants (total_points + streak + correct_count)
//
// Idempotenz: bei UNIQUE-Violation (Code 23505) freundlicher Fehler
// „bereits beantwortet" — Race-Schutz gegen Doppelklick + Reload.
//
// Service-Role: Schüler:innen haben kein auth.uid(). studentCodeId +
// classId kommen IMMER aus jose-Session (requireStudentSession), NIE
// aus Client-Param.

export type SubmitQuizAnswerArgs = {
  sessionId: string;
  questionIndex: number;
  answer: BlockAnswer;
};

export type SubmitQuizAnswerResult = {
  error: string | null;
  isCorrect: boolean;
  points: number;
};

const FAIL = (error: string): SubmitQuizAnswerResult => ({
  error,
  isCorrect: false,
  points: 0,
});

type SessionRow = {
  id: string;
  module_id: string;
  status: string;
  current_question_index: number;
  current_question_started_at: string | null;
  time_limit_seconds: number;
  scoring_time_limit_s: number;
  question_order: { blockId: string; blockType: string }[];
};

type ParticipantRow = {
  current_streak: number;
};

// Lädt die aktive Quiz-Session der eigenen Klasse + validiert dass die
// Antwort zur AKTUELLEN Frage gehört. Verhindert STALE_QUESTION-Race
// (Lehrer:in schaltet eine Frage weiter während Schüler:in noch tippt).
async function loadAndValidateSession(
  supabase: ReturnType<typeof createServiceClient>,
  classId: string,
  questionIndex: number
): Promise<SessionRow | { error: string }> {
  const { data } = await supabase
    .from('quiz_sessions')
    .select(
      'id, module_id, status, current_question_index, current_question_started_at, time_limit_seconds, scoring_time_limit_s, question_order'
    )
    .eq('class_id', classId)
    .in('status', ['active'])
    .maybeSingle();
  if (!data) return { error: 'Gerade läuft kein Quiz für deine Klasse.' };
  const row = data as SessionRow;
  if (row.status !== 'active') return { error: 'Zu spät — die Frage ist nicht mehr aktiv.' };
  if (row.current_question_index !== questionIndex) {
    return { error: 'Zu spät — diese Frage wurde schon weitergeschaltet.' };
  }
  return row;
}

// Findet den Block in modules.content per blockId aus question_order.
// Defensive: Modul-Content könnte vom Schema abweichen (z.B. nach
// Editor-Bug) — wir parsen via zod und fallen zurück auf null.
async function findQuizBlock(
  supabase: ReturnType<typeof createServiceClient>,
  moduleId: string,
  blockId: string
): Promise<Block | null> {
  const { data } = await supabase
    .from('modules')
    .select('content')
    .eq('id', moduleId)
    .maybeSingle();
  if (!data?.content) return null;
  const parsed = moduleContentSchema.safeParse(data.content);
  if (!parsed.success) return null;
  return parsed.data.blocks.find((b) => b.id === blockId) ?? null;
}

// Berechnet elapsed_ms server-seitig (current_question_started_at →
// jetzt). Client-Time-Hints werden bewusst ignoriert — würde sonst Cheating
// erlauben („sag elapsed=0, kriege max Punkte"). Cap auf time_limit.
function computeElapsedMs(session: SessionRow): number {
  if (!session.current_question_started_at) return session.time_limit_seconds * 1000;
  const started = new Date(session.current_question_started_at).getTime();
  const elapsed = Date.now() - started;
  const capped = Math.min(Math.max(elapsed, 0), session.time_limit_seconds * 1000);
  return capped;
}

async function loadParticipantStreak(
  supabase: ReturnType<typeof createServiceClient>,
  sessionId: string,
  studentCodeId: string
): Promise<number> {
  const { data } = await supabase
    .from('quiz_participants')
    .select('current_streak')
    .eq('session_id', sessionId)
    .eq('student_code_id', studentCodeId)
    .maybeSingle();
  return (data as ParticipantRow | null)?.current_streak ?? 0;
}

async function writeAnswerAndUpdateParticipant(
  supabase: ReturnType<typeof createServiceClient>,
  args: {
    sessionId: string;
    studentCodeId: string;
    questionIndex: number;
    blockId: string;
    answer: BlockAnswer;
    isCorrect: boolean;
    elapsedMs: number;
    points: number;
    newStreak: number;
  }
): Promise<SubmitQuizAnswerResult | null> {
  const { error: insErr } = await supabase.from('quiz_answers').insert({
    session_id: args.sessionId,
    student_code_id: args.studentCodeId,
    question_index: args.questionIndex,
    block_id: args.blockId,
    answer: args.answer,
    is_correct: args.isCorrect,
    elapsed_ms: args.elapsedMs,
    points_awarded: args.points,
  });
  if (insErr) {
    if (insErr.code === '23505') {
      return FAIL('Du hast diese Frage bereits beantwortet.');
    }
    return FAIL('Antwort konnte nicht gespeichert werden.');
  }
  // Nur Streak-State + Heartbeat updaten. total_points, longest_streak,
  // correct_count werden im Leaderboard (S3) per SUM/MAX/COUNT direkt aus
  // quiz_answers aggregiert — vermeidet jede Race-Condition. Die Spalten
  // in quiz_participants bleiben als Performance-Cache für später (S3
  // entscheidet ob Aggregation oder Cache).
  await supabase
    .from('quiz_participants')
    .update({
      current_streak: args.newStreak,
      last_seen_at: new Date().toISOString(),
    })
    .eq('session_id', args.sessionId)
    .eq('student_code_id', args.studentCodeId);
  return null;
}

export async function submitQuizAnswer(
  args: SubmitQuizAnswerArgs
): Promise<SubmitQuizAnswerResult> {
  const session = await requireStudentSession();
  const supabase = createServiceClient();

  const sessionOrErr = await loadAndValidateSession(supabase, session.classId, args.questionIndex);
  if ('error' in sessionOrErr) return FAIL(sessionOrErr.error);
  const sess = sessionOrErr;

  const ref = sess.question_order[args.questionIndex];
  if (!ref) return FAIL('Diese Frage gibt es nicht.');

  const block = await findQuizBlock(supabase, sess.module_id, ref.blockId);
  if (!block) return FAIL('Frage konnte nicht geladen werden.');

  const isCorrect = evaluateBlock(block, args.answer);
  const elapsedMs = computeElapsedMs(sess);
  const prevStreak = await loadParticipantStreak(supabase, sess.id, session.studentCodeId);
  const newStreak = isCorrect ? prevStreak + 1 : 0;
  const points = calculatePoints(isCorrect, elapsedMs, sess.scoring_time_limit_s, newStreak);

  const writeErr = await writeAnswerAndUpdateParticipant(supabase, {
    sessionId: sess.id,
    studentCodeId: session.studentCodeId,
    questionIndex: args.questionIndex,
    blockId: ref.blockId,
    answer: args.answer,
    isCorrect,
    elapsedMs,
    points,
    newStreak,
  });
  if (writeErr) return writeErr;

  return { error: null, isCorrect, points };
}
