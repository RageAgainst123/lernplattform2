import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin } from '@/lib/db/modules';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const mod = await getModuleByIdForAdmin(id);
  if (!mod) notFound();
  const meta: ModuleMetadata = {
    title: mod.title,
    description: mod.description ?? '',
    schulstufe: mod.schulstufe ?? null,
    kompetenzbereich: mod.kompetenzbereich ?? null,
    topic: mod.topic ?? '',
    estimatedMinutes: mod.estimatedMinutes ?? null,
    isPublished: mod.isPublished,
    displayMode: mod.displayMode,
  };
  return <ModuleEditor moduleId={id} initialMeta={meta} initialBlocks={mod.content.blocks} />;
}
