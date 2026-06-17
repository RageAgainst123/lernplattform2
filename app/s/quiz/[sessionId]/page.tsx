import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getQuizBannerForStudent } from '@/lib/db/quiz-sessions';
import { QuizLiveRunner } from '@/components/student/QuizLiveRunner';
import type { QuizQuestionState } from '@/app/api/quiz/question/route';

export const metadata: Metadata = {
  title: 'Quiz — Lernplattform',
};

// Schüler:innen-Live-Quiz-Page (Phase S1.E + S2.D).
//
// Status-bewusster Renderer im Client (QuizLiveRunner) übernimmt die
// Logik: lobby → Warte-Screen, active → Antwort-Buttons,
// between → "schau nach vorne", none → Redirect zu /s.
//
// Initial-Snapshot kommt server-seitig (per Banner-Helper) damit beim
// Mount kein Flicker. Polling übernimmt /api/quiz/question.
//
// sessionId aus der URL ist Hint — die echte Quote über jose-Session +
// classId verhindert IDOR.

export default async function StudentQuizLivePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await requireStudentSession();
  await params;
  const banner = await getQuizBannerForStudent(session.classId, session.studentCodeId);
  if (!banner) redirect('/s');
  if (!banner.alreadyJoined) redirect('/s');

  // Wir lassen den Client-Hook beim ersten Poll den vollen QuestionState
  // holen (active enthält den Block, den wir hier server-side nochmal
  // teuer rendern würden). Initial-State ist daher minimal: 'lobby' wenn
  // banner.status='lobby' ist, sonst ein platzhalter-'lobby'-State
  // (Client polled in 1-2s den echten Stand und ersetzt das Frame).
  const initial: QuizQuestionState =
    banner.status === 'lobby'
      ? { kind: 'lobby', sessionId: banner.sessionId }
      : { kind: 'lobby', sessionId: banner.sessionId };

  return <QuizLiveRunner initial={initial} />;
}
