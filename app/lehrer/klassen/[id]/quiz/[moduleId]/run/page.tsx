import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getModuleById } from '@/lib/db/modules';
import {
  getActiveQuizSessionForClass,
  getQuizParticipantsForTeacher,
} from '@/lib/db/quiz-sessions';
import { QuizLobbyPolling } from '@/components/quiz/QuizLobbyPolling';
import type { TeacherLobbyState } from '@/app/api/quiz/lobby/route';

export const metadata: Metadata = {
  title: 'Quiz-Lobby — Lernplattform',
  robots: { index: false, follow: false },
};

// Beamer-Lobby für eine laufende Quiz-Session (Phase S1.D + S1.C-Polling).
//
// Wenn noch keine Session läuft → zurück zur Setup-Seite.
// Sonst: Lobby mit Teilnehmer:innen-Liste, die alle 1.5s live aktualisiert.

export default async function QuizRunPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const [schoolClass, moduleData, session] = await Promise.all([
    getClass(id),
    getModuleById(moduleId),
    getActiveQuizSessionForClass(id),
  ]);

  if (!schoolClass || !moduleData) notFound();

  if (!session || session.moduleId !== moduleData.id) {
    redirect(`/lehrer/klassen/${id}/quiz/${moduleId}`);
  }

  const participants = await getQuizParticipantsForTeacher(session.id);
  const initial: TeacherLobbyState = {
    kind: 'teacher',
    session: {
      id: session.id,
      status: session.status === 'ended' ? 'lobby' : session.status,
      participantCount: participants.length,
      participants,
    },
  };

  return (
    <QuizLobbyPolling
      classId={schoolClass.id}
      moduleTitle={moduleData.title}
      teamMode={session.teamMode}
      initial={initial}
    />
  );
}
