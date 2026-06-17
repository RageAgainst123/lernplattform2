import { requireAdmin } from '@/lib/auth/admin-auth';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Neuer Abschlusstest. activityKind='abschlusstest' → muss einem Thema
// zugeordnet werden (Phase G5: Voraussetzung = alle Lernmodule des Themas
// erledigt). Display-Modus 'quiz' für Sofort-Feedback.

const EMPTY_META: ModuleMetadata = {
  title: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
  activityKind: 'abschlusstest',
  displayMode: 'quiz',
};

export default async function NewAbschlusstestPage() {
  await requireAdmin();
  return <ModuleEditor initialMeta={EMPTY_META} initialBlocks={[]} />;
}
