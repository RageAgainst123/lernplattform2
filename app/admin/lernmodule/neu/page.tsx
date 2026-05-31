import { requireAdmin } from '@/lib/auth/admin-auth';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Neues Lernmodul anlegen (Phase E). Dünner Wrapper über ModuleEditor mit
// fix gesetzter activityKind='lernmodul'. Default-Display-Modus: quiz.

const EMPTY_META: ModuleMetadata = {
  title: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
  activityKind: 'lernmodul',
  displayMode: 'quiz',
};

export default async function NewLernmodulPage() {
  await requireAdmin();
  return <ModuleEditor initialMeta={EMPTY_META} initialBlocks={[]} />;
}
