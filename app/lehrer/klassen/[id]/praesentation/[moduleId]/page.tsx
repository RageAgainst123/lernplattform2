import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getModuleById } from '@/lib/db/modules';
import { moduleContentSchema } from '@/lib/schemas/blocks';
import { PresentationRunner } from '@/components/blocks/PresentationRunner';

export const metadata: Metadata = {
  title: 'Präsentation — Lernplattform',
  robots: { index: false, follow: false },
};

// Beamer-Ansicht: Lehrer:in präsentiert ein presentation-Modul vollflächig.
// Vollbild-taugliche Großdarstellung, durchblätterbar (Buttons + Tastatur).
export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const [schoolClass, moduleData] = await Promise.all([getClass(id), getModuleById(moduleId)]);
  if (!schoolClass || !moduleData || moduleData.displayMode !== 'presentation') {
    notFound();
  }

  const parsed = moduleContentSchema.safeParse(moduleData.content);
  const blocks = parsed.success ? parsed.data.blocks : [];

  // classId + moduleId → Live-Modus: startet eine Session, Schüler:innen-Geräte
  // dimmen bzw. zeigen bei live_poll-Folien die Abstimmung.
  return <PresentationRunner blocks={blocks} classId={schoolClass.id} moduleId={moduleData.id} />;
}
