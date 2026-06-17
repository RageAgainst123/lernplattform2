import { requireAdmin } from '@/lib/auth/admin-auth';
import { ModuleEditor, type ModuleMetadata } from '@/components/admin/ModuleEditor';

// Neue Präsentation anlegen (Phase E). activityKind='praesentation' — der
// Editor blendet das Display-Mode-Select automatisch aus und der AddBlockDialog
// zeigt nur Slide + Live-Blöcke. display_mode ist für Präsentationen irrelevant,
// bleibt aber technisch auf 'quiz' (DB-Default).

const EMPTY_META: ModuleMetadata = {
  title: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
  activityKind: 'praesentation',
  displayMode: 'quiz',
};

export default async function NewPraesentationPage() {
  await requireAdmin();
  return <ModuleEditor initialMeta={EMPTY_META} initialBlocks={[]} />;
}
