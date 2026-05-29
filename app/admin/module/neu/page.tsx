import { requireAdmin } from '@/lib/auth/admin-auth';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

const EMPTY_META: ModuleMetadata = {
  title: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
};

export default async function NewModulePage() {
  await requireAdmin();
  return <ModuleEditor initialMeta={EMPTY_META} initialBlocks={[]} />;
}
