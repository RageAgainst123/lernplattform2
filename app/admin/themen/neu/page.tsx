import { requireAdmin } from '@/lib/auth/admin-auth';
import { TopicEditor } from '@/components/admin/TopicEditor';
import type { TopicFormValue } from '@/components/admin/TopicForm';

// Neues Thema anlegen (Phase G). Dünner Wrapper über TopicEditor mit
// Default-Werten — sortOrder 0 (User kann hochsetzen), nicht veröffentlicht.

const EMPTY: TopicFormValue = {
  slug: '',
  label: '',
  description: '',
  schulstufe: null,
  kompetenzbereich: null,
  isPublished: false,
  sortOrder: 0,
};

export default async function NewTopicPage() {
  await requireAdmin();
  return <TopicEditor initialValue={EMPTY} />;
}
