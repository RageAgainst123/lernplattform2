import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getQuizBannerForStudent } from '@/lib/db/quiz-sessions';
import { QuizWaitPolling } from '@/components/student/QuizWaitPolling';
import type { StudentLobbyState } from '@/app/api/quiz/lobby/route';

export const metadata: Metadata = {
  title: 'Quiz-Lobby — Lernplattform',
};

// Schüler:innen-Wait-Page nach dem Beitritt zu einem Live-Quiz (S1.E + S1.C).
// Server-rendered den initialen Snapshot, danach übernimmt das Polling im
// Client (QuizWaitPolling). Status-Wechsel 'lobby' → 'active' kommt
// automatisch ohne F5.
//
// sessionId aus der URL ist nur ein Hint — die echte Quote „läuft gerade
// ein Quiz?" kommt server-seitig über die jose-Session + classId.

export default async function StudentQuizLobbyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await requireStudentSession();
  await params; // sessionId wird heute nicht gebraucht — Quote läuft über classId
  const banner = await getQuizBannerForStudent(session.classId, session.studentCodeId);
  if (!banner) redirect('/s');
  if (!banner.alreadyJoined) redirect('/s');

  const initial: StudentLobbyState = { kind: 'student', banner };
  return <QuizWaitPolling initial={initial} moduleTitleInitial={banner.moduleTitle} />;
}
