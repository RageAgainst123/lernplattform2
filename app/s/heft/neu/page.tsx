import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { createPortfolioEntry } from '@/lib/db/portfolio-actions';

// /s/heft/neu legt direkt einen leeren Eintrag an und redirected in den
// Editor. Dadurch sieht die UX nach „+ Neue Notiz" sofort den Editor
// statt eines leeren Wrapper-Forms — wir sparen einen Klick.

export const dynamic = 'force-dynamic';

export default async function NewNotebookEntryPage() {
  await requireStudentSession();
  const { id } = await createPortfolioEntry({ title: '', contentJson: {} });
  redirect(`/s/heft/${id}`);
}
