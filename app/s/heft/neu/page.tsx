import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';

// /s/heft/neu legt direkt einen leeren Eintrag an und redirected in den
// Editor — der User klickt „+ Neue Notiz" und landet sofort im Editor.
//
// Wichtig (Bugfix): wir können hier NICHT die Server-Action
// createPortfolioEntry aufrufen, weil sie revalidatePath ruft —
// das ist während eines Page-Renders in Next 16 nicht erlaubt
// (digest 1970315277@E7). Wir machen den Insert daher direkt
// via Service-Role-Client. Da der neue Eintrag eh leer ist und
// die Heft-Liste beim nächsten Besuch frisch geladen wird, brauchen
// wir kein revalidatePath.

export const dynamic = 'force-dynamic';

export default async function NewNotebookEntryPage() {
  const session = await requireStudentSession();
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('portfolio_entries')
    .insert({
      student_code_id: session.studentCodeId,
      topic_id: null,
      title: null,
      content_json: {},
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error('Heft-Eintrag konnte nicht angelegt werden: ' + (error?.message ?? 'unknown'));
  }
  redirect(`/s/heft/${data.id as string}`);
}
