import { requireAdmin } from '@/lib/auth/admin-auth';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Neues Quiz anlegen (Phase G1+). Dünner Wrapper über ModuleEditor mit
// fix gesetzter activityKind='quiz'. Display-Modus 'quiz' (Block-für-Block).
// Block-Filter im AddBlockDialog erlaubt nur reine Aufgaben (MC, TF, Fill, Match).

const EMPTY_META: ModuleMetadata = {
  title: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
  activityKind: 'quiz',
  displayMode: 'quiz',
};

export default async function NewQuizPage() {
  await requireAdmin();
  return <ModuleEditor initialMeta={EMPTY_META} initialBlocks={[]} />;
}
