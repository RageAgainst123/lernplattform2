import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getPublishedModuleByIdForTeacher } from '@/lib/db/modules';
import {
  getActiveQuizSessionForClass,
  getQuizParticipantsForTeacher,
} from '@/lib/db/quiz-sessions';
import { getQuizBeamerQuestionState } from '@/lib/db/quiz-beamer-state';
import { QuizBeamerRunner } from '@/components/quiz/QuizBeamerRunner';
import type { TeacherLobbyState } from '@/app/api/quiz/lobby/route';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';

export const metadata: Metadata = {
  title: 'Quiz-Beamer — Lernplattform',
  robots: { index: false, follow: false },
};

// Beamer-Runner für eine laufende Quiz-Session (Phase S2.C).
// Initiale Snapshots für Lobby UND Frage/Reveal werden server-seitig
// vorbereitet → kein Flicker beim Mount.
//
// Polling übernimmt useQuizBeamerPoll im Client (1s aktiv / 3s sonst).

export default async function QuizRunPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const [schoolClass, moduleData, session] = await Promise.all([
    getClass(id),
    getPublishedModuleByIdForTeacher(moduleId),
    getActiveQuizSessionForClass(id),
  ]);

  if (!schoolClass || !moduleData) notFound();

  if (!session || session.moduleId !== moduleData.id) {
    redirect(`/lehrer/klassen/${id}/quiz/${moduleId}`);
  }

  const participants = await getQuizParticipantsForTeacher(session.id);
  const initialLobby: TeacherLobbyState = {
    kind: 'teacher',
    session: {
      id: session.id,
      status: session.status === 'ended' ? 'lobby' : session.status,
      participantCount: participants.length,
      participants,
    },
  };
  const initialBeamer = await buildInitialBeamer(session);

  return (
    <QuizBeamerRunner
      classId={schoolClass.id}
      moduleTitle={moduleData.title}
      teamMode={session.teamMode}
      initialBeamer={initialBeamer}
      initialLobby={initialLobby}
    />
  );
}

// Beamer-Initial-Snapshot je nach Session-Status.
async function buildInitialBeamer(
  session: NonNullable<Awaited<ReturnType<typeof getActiveQuizSessionForClass>>>
): Promise<QuizBeamerState> {
  if (session.status === 'lobby') return { kind: 'lobby', sessionId: session.id };
  if (session.status !== 'active' && session.status !== 'between_questions') {
    return { kind: 'none' };
  }
  const ref = session.questionOrder[session.currentQuestionIndex];
  if (!ref) return { kind: 'lobby', sessionId: session.id };
  const question = await getQuizBeamerQuestionState(
    session.id,
    session.moduleId,
    ref.blockId,
    session.currentQuestionIndex,
    session.timeLimitSeconds,
    session.currentQuestionStartedAt
  );
  if (!question) return { kind: 'lobby', sessionId: session.id };
  return {
    kind: session.status === 'between_questions' ? 'between' : 'active',
    sessionId: session.id,
    question,
  };
}
