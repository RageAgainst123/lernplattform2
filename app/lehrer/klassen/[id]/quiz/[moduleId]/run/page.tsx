import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getModuleById } from '@/lib/db/modules';
import {
  getActiveQuizSessionForClass,
  getQuizParticipantsForTeacher,
} from '@/lib/db/quiz-sessions';
import { QuizLobby } from '@/components/quiz/QuizLobby';

export const metadata: Metadata = {
  title: 'Quiz-Lobby — Lernplattform',
  robots: { index: false, follow: false },
};

// Beamer-Lobby für eine laufende Quiz-Session (Phase S1.D, Spec §5.3).
//
// Wenn noch keine Session läuft → zurück zur Setup-Seite.
// Wenn Session in 'ended' ist → zurück zur Klassenseite.
// Sonst: Lobby mit Teilnehmer:innen-Liste (heute static, S1.C bringt
// Polling) und „Quiz starten"-Button.

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

  // Keine laufende Session → Setup-Seite anzeigen.
  if (!session || session.moduleId !== moduleData.id) {
    redirect(`/lehrer/klassen/${id}/quiz/${moduleId}`);
  }

  const participants = await getQuizParticipantsForTeacher(session.id);

  return (
    <QuizLobby
      classId={schoolClass.id}
      moduleTitle={moduleData.title}
      teamMode={session.teamMode}
      status={session.status === 'ended' ? 'lobby' : session.status}
      participants={participants}
    />
  );
}
