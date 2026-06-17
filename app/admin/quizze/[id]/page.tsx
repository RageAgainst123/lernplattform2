import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin, getModuleProgressCount } from '@/lib/db/modules';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Quiz bearbeiten. Wenn jemand eine fremde ID auf dem Quiz-Pfad öffnet,
// redirect zur korrekten Route je nach activity_kind.

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [mod, progressCount] = await Promise.all([
    getModuleByIdForAdmin(id),
    getModuleProgressCount(id),
  ]);
  if (!mod) notFound();
  if (mod.activityKind !== 'quiz') {
    const seg =
      mod.activityKind === 'lernmodul'
        ? 'lernmodule'
        : mod.activityKind === 'praesentation'
          ? 'praesentationen'
          : 'abschlusstests';
    redirect(`/admin/${seg}/${id}`);
  }
  const meta: ModuleMetadata = {
    title: mod.title,
    description: mod.description ?? '',
    schulstufe: mod.schulstufe ?? null,
    kompetenzbereich: mod.kompetenzbereich ?? null,
    topic: mod.topic ?? '',
    estimatedMinutes: mod.estimatedMinutes ?? null,
    isPublished: mod.isPublished,
    activityKind: mod.activityKind,
    displayMode: mod.displayMode,
  };
  return (
    <ModuleEditor
      moduleId={id}
      initialMeta={meta}
      initialBlocks={mod.content.blocks}
      progressCount={progressCount}
    />
  );
}
