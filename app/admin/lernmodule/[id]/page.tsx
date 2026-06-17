import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin, getModuleProgressCount } from '@/lib/db/modules';
import { ACTIVITY_INFO } from '@/lib/activities';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Lernmodul bearbeiten (Phase E). Schutz: wenn jemand eine fremde-Aktivität-
// ID auf dem Lernmodul-Pfad öffnet, redirect zur richtigen Route — macht
// die URLs idiotensicher (z.B. bei vertauschten Bookmarks oder shared Links).

export default async function EditLernmodulPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [mod, progressCount] = await Promise.all([
    getModuleByIdForAdmin(id),
    getModuleProgressCount(id),
  ]);
  if (!mod) notFound();
  if (mod.activityKind !== 'lernmodul') {
    redirect(`/admin/${ACTIVITY_INFO[mod.activityKind].urlSegment}/${id}`);
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
