import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getProgress, getStudentModule } from '@/lib/db/student-modules';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Geschafft',
};

export default async function ModuleDonePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession();
  const { id } = await params;
  const moduleData = await getStudentModule(id, session.classId);
  const progress = await getProgress(session.studentCodeId, id);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Geschafft!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Du hast <span className="font-medium">{moduleData?.title ?? 'das Modul'}</span>{' '}
            abgeschlossen.
          </p>
          {progress && progress.completedAt && (
            <p className="text-muted-foreground">Gut gemacht — schau dir gern weitere Module an.</p>
          )}
          <Link href="/s" className={buttonVariants()}>
            Zurück zur Übersicht
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
