import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getPortfolioEntry } from '@/lib/db/portfolio';
import { NotebookEditor } from '@/components/student/NotebookEditor';

// Heft-Eintrag bearbeiten. Owner-Check: getPortfolioEntry filtert auf
// student_code_id — fremde IDs ergeben null → notFound. URL-Rate-Schutz.

export const metadata: Metadata = {
  title: 'Heft-Eintrag',
};

export default async function NotebookEntryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStudentSession();
  const { id } = await params;
  const entry = await getPortfolioEntry(id, session.studentCodeId);
  if (!entry) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
      <NotebookEditor
        entryId={entry.id}
        initialTitle={entry.title ?? ''}
        initialContent={entry.contentJson ?? {}}
      />
    </div>
  );
}
