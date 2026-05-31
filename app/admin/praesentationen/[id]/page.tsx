import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin } from '@/lib/db/modules';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Präsentation bearbeiten (Phase E). Schutz wie bei Lernmodulen: vertauschte
// URL → automatischer Redirect zur richtigen Aktivitäts-Route.

export default async function EditPraesentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const mod = await getModuleByIdForAdmin(id);
  if (!mod) notFound();
  if (mod.activityKind !== 'praesentation') {
    redirect(`/admin/lernmodule/${id}`);
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
