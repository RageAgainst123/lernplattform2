import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin } from '@/lib/db/modules';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Abschlusstest bearbeiten. Bei falscher Aktivitäts-ID redirect zur passenden
// Route — verhindert dass Geo verwirrt ist, wenn er die URL kopiert.

export default async function EditAbschlusstestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const mod = await getModuleByIdForAdmin(id);
  if (!mod) notFound();
  if (mod.activityKind !== 'abschlusstest') {
    const seg =
      mod.activityKind === 'lernmodul'
        ? 'lernmodule'
        : mod.activityKind === 'praesentation'
          ? 'praesentationen'
          : 'quizze';
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
  return <ModuleEditor moduleId={id} initialMeta={meta} initialBlocks={mod.content.blocks} />;
}
