import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getModuleById } from '@/lib/db/modules';
import { getActiveQuizSessionForClass } from '@/lib/db/quiz-sessions';
import { moduleContentSchema } from '@/lib/schemas/blocks';
import { buildQuizQuestionOrder } from '@/lib/quiz/question-order';
import { QuizSetupForm } from '@/components/quiz/QuizSetupForm';

export const metadata: Metadata = {
  title: 'Live-Quiz starten — Lernplattform',
  robots: { index: false, follow: false },
};

// Setup-Seite für ein Live-Klassen-Quiz (Phase S1.D, Spec §5.2).
//
// Vorbedingungen:
//   • Eigene Klasse (RLS via getClass + auth.uid())
//   • Modul existiert und ist quiz oder abschlusstest (live-tauglich)
//   • Mindestens 1 live-tauglicher Block (sonst Hinweis im Form)
//
// Wenn schon eine Quiz-Session läuft → direkt in die Lobby umleiten.

export default async function QuizSetupPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const [schoolClass, moduleData, activeSession] = await Promise.all([
    getClass(id),
    getModuleById(moduleId),
    getActiveQuizSessionForClass(id),
  ]);

  if (!schoolClass || !moduleData) notFound();
  if (moduleData.activityKind !== 'quiz' && moduleData.activityKind !== 'abschlusstest') {
    notFound();
  }

  // Wenn bereits eine Quiz-Session der Klasse läuft (Reload oder Doppel-Tab):
  // direkt zur Lobby — Setup zweimal anlegen würde der RPC durch end-then-
  // insert sowieso abfangen, aber die UX ist sauberer mit direktem Redirect.
  if (activeSession && activeSession.moduleId === moduleData.id) {
    redirect(`/lehrer/klassen/${id}/quiz/${moduleId}/run`);
  }

  const parsed = moduleContentSchema.safeParse(moduleData.content);
  const blocks = parsed.success ? parsed.data.blocks : [];
  const questionOrder = buildQuizQuestionOrder(blocks);

  return (
    <QuizSetupForm
      classId={schoolClass.id}
      moduleId={moduleData.id}
      moduleTitle={moduleData.title}
      questionOrder={questionOrder}
    />
  );
}
