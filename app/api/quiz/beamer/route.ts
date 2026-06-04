import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/teacher-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { getActiveQuizSessionForClass } from '@/lib/db/quiz-sessions';
import {
  getQuizBeamerQuestionState,
  type QuizBeamerQuestionState,
} from '@/lib/db/quiz-beamer-state';

// Polling-Endpunkt für die Lehrer:innen-Beamer-Ansicht in der Frage-Phase
// (Phase S2.C).
//
// Liefert die VOLLE Frage (inkl. correct-Flags — Lehrer:in darf sehen) +
// Antwort-Verteilung pro Option für den Reveal-Bildschirm.
//
// Auth-Modell: Eigener Endpoint statt /api/quiz/lobby zu überladen.
//   1. requireUser() — Lehrer:innen-Auth
//   2. classId aus Query-Param, dann gegen Klassen-Owner prüfen
//   3. Service-Role nur für Aggregation (User-Client + RLS reicht nicht,
//      weil aggregierte Queries kompliziert wären)
//
// Status-Diskriminator:
//   • 'none' — keine Lehrer:in-Session, keine Klasse, kein Quiz
//   • 'lobby' — Quiz läuft, aber noch keine Frage gestartet
//   • 'active' — Frage läuft, distribution leer/teilbefüllt
//   • 'between' — letzte Frage durch, distribution voll → Reveal-Anzeige

export const dynamic = 'force-dynamic';

export type QuizBeamerState =
  | { kind: 'none' }
  | { kind: 'lobby'; sessionId: string }
  | { kind: 'active'; sessionId: string; question: QuizBeamerQuestionState }
  | { kind: 'between'; sessionId: string; question: QuizBeamerQuestionState };

function noStore(state: QuizBeamerState): NextResponse {
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

async function isOwnClass(teacherId: string, classId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .maybeSingle();
  return !!data && (data.teacher_id as string) === teacherId;
}

// Auth-Vorprüfung: liefert classId wenn der Caller eingeloggte Lehrer:in
// einer eigenen Klasse ist, sonst null. Hält die Komplexität von GET klein.
async function authorizedClassId(request: Request): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const classId = new URL(request.url).searchParams.get('classId');
  if (!classId) return null;
  if (!(await isOwnClass(user.id, classId))) return null;
  return classId;
}

export async function GET(request: Request) {
  const classId = await authorizedClassId(request);
  if (!classId) return noStore({ kind: 'none' });

  const quiz = await getActiveQuizSessionForClass(classId);
  if (!quiz) return noStore({ kind: 'none' });

  if (quiz.status === 'lobby') return noStore({ kind: 'lobby', sessionId: quiz.id });
  if (quiz.status !== 'active' && quiz.status !== 'between_questions') {
    return noStore({ kind: 'none' });
  }

  const ref = quiz.questionOrder[quiz.currentQuestionIndex];
  if (!ref) return noStore({ kind: 'none' });

  const question = await getQuizBeamerQuestionState(
    quiz.id,
    quiz.moduleId,
    ref.blockId,
    quiz.currentQuestionIndex,
    quiz.timeLimitSeconds,
    quiz.currentQuestionStartedAt
  );
  if (!question) return noStore({ kind: 'none' });

  return noStore({
    kind: quiz.status === 'between_questions' ? 'between' : 'active',
    sessionId: quiz.id,
    question,
  });
}
