import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Helper für /api/quiz/question (Phase S2.B): zählt wie viele
// Teilnehmer:innen die aktuelle Frage schon beantwortet haben + ob die
// anrufende Schüler:in selbst dabei ist. Ausgelagert aus quiz-sessions.ts
// wegen max-lines (200).

export type QuestionProgress = {
  answered: number;
  total: number;
  ownAnswer: { isCorrect: boolean; points: number } | null;
};

export async function getQuestionProgress(
  sessionId: string,
  questionIndex: number,
  studentCodeId: string
): Promise<QuestionProgress> {
  const supabase = createServiceClient();
  // Drei Queries parallel: total, answered-count, eigene Antwort.
  const [totalRes, answeredRes, ownRes] = await Promise.all([
    supabase
      .from('quiz_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId),
    supabase
      .from('quiz_answers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex),
    supabase
      .from('quiz_answers')
      .select('is_correct, points_awarded')
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex)
      .eq('student_code_id', studentCodeId)
      .maybeSingle(),
  ]);
  const own = ownRes.data
    ? {
        isCorrect: ownRes.data.is_correct as boolean,
        points: ownRes.data.points_awarded as number,
      }
    : null;
  return {
    total: totalRes.count ?? 0,
    answered: answeredRes.count ?? 0,
    ownAnswer: own,
  };
}
