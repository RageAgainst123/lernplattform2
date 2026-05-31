import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin } from '@/lib/db/modules';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Lernmodul bearbeiten (Phase E). Schutz: wenn jemand eine Präsentations-id
// auf dem Lernmodul-Pfad öffnet, redirect zur richtigen Route — das macht
// die URLs idiotensicher (z.B. bei vertauschten Bookmarks oder shared Links).

export default async function EditLernmodulPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const mod = await getModuleByIdForAdmin(id);
  if (!mod) notFound();
  if (mod.activityKind !== 'lernmodul') {
    redirect(`/admin/praesentationen/${id}`);
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
