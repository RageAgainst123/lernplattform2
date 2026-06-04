import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Backfill für pending quiz_answers beim Quiz-Ende (Phase S4, Spec §5.7).
//
// Ziel: Wer einzelne Fragen nicht beantwortet hat, bekommt eine 0-Punkte-
// Zeile — damit ist das Final-Leaderboard fair (Teilnahme zählt, NULLs
// verschwinden). Backfill nur für Fragen 0..currentQuestionIndex (= die
// erreichten Fragen). Wird aus endQuizSession aufgerufen.

export type QuestionRef = { blockId: string };

type PendingInsert = {
  session_id: string;
  student_code_id: string;
  question_index: number;
  block_id: string;
  answer: null;
  is_correct: false;
  elapsed_ms: 0;
  points_awarded: 0;
};

// Pure-Helper: berechnet welche Insert-Rows nötig sind, gegeben Teilnehmer:
// innen-IDs, schon vorhandene (student, question)-Paare und die erreichten
// Fragen. Pro Teilnehmer:in × Frage genau eine Row, wenn nicht in `seen`.
// Reihenfolge: Teilnehmer:in zuerst, dann Frage-Index aufsteigend.
export function buildBackfillInserts(args: {
  sessionId: string;
  studentCodeIds: string[];
  seen: Set<string>; // Schlüssel: `${studentCodeId}:${questionIndex}`
  questionOrder: QuestionRef[];
  currentQuestionIndex: number;
}): PendingInsert[] {
  const inserts: PendingInsert[] = [];
  for (const studentId of args.studentCodeIds) {
    for (let qi = 0; qi <= args.currentQuestionIndex; qi++) {
      if (args.seen.has(`${studentId}:${qi}`)) continue;
      const ref = args.questionOrder[qi];
      if (!ref) continue;
      inserts.push({
        session_id: args.sessionId,
        student_code_id: studentId,
        question_index: qi,
        block_id: ref.blockId,
        answer: null,
        is_correct: false,
        elapsed_ms: 0,
        points_awarded: 0,
      });
    }
  }
  return inserts;
}

// Wrapper: lädt aus DB, berechnet Inserts via buildBackfillInserts, upsertet
// mit ignoreDuplicates (UNIQUE-Constraint schützt gegen Race mit gleichzeitig
// laufendem submitQuizAnswer aus Schüler:innen-Tabs).
export async function backfillPendingAnswers(
  sessionId: string,
  questionOrder: QuestionRef[],
  currentQuestionIndex: number
): Promise<void> {
  const svc = createServiceClient();

  const { data: participants } = await svc
    .from('quiz_participants')
    .select('student_code_id')
    .eq('session_id', sessionId);
  if (!participants || participants.length === 0) return;

  const { data: existing } = await svc
    .from('quiz_answers')
    .select('student_code_id, question_index')
    .eq('session_id', sessionId);

  const seen = new Set<string>();
  for (const row of existing ?? []) {
    seen.add(`${row.student_code_id as string}:${row.question_index as number}`);
  }

  const inserts = buildBackfillInserts({
    sessionId,
    studentCodeIds: participants.map((p) => p.student_code_id as string),
    seen,
    questionOrder,
    currentQuestionIndex,
  });

  if (inserts.length === 0) return;
  await svc.from('quiz_answers').upsert(inserts, {
    onConflict: 'session_id,student_code_id,question_index',
    ignoreDuplicates: true,
  });
}
