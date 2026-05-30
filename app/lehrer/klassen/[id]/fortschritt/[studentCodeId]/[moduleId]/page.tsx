import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getTeacherSubmission } from '@/lib/db/teacher-submission';
import { SubmissionScoreHeader } from '@/components/teacher/SubmissionScoreHeader';
import { SubmissionReview } from '@/components/teacher/SubmissionReview';

export const metadata: Metadata = {
  title: 'Abgabe ansehen',
  robots: { index: false },
};

type Params = Promise<{ id: string; studentCodeId: string; moduleId: string }>;

export default async function SubmissionPage({ params }: { params: Params }) {
  await requireUser();
  const { id, studentCodeId, moduleId } = await params;
  const submission = await getTeacherSubmission(id, studentCodeId, moduleId);
  if (!submission) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <Link
          href={`/lehrer/klassen/${id}/fortschritt`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Zurück zur Fortschritts-Übersicht
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {submission.codename} · {submission.moduleTitle}
        </h1>
      </div>

      <SubmissionScoreHeader
        score={submission.score}
        maxScore={submission.maxScore}
        passThreshold={submission.passThreshold}
        hasProgress={submission.hasProgress}
      />

      {submission.hasProgress ? (
        <SubmissionReview classId={id} submission={submission} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Sobald die Schüler:in das Modul bearbeitet, erscheinen hier die Antworten und du kannst
          Feedback geben.
        </p>
      )}
    </div>
  );
}
