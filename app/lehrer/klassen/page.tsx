import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClasses } from '@/lib/db/classes';
import { buttonVariants } from '@/components/ui/button';
import { ClassCard } from '@/components/teacher/ClassCard';

export const metadata: Metadata = {
  title: 'Klassen — Lernplattform',
};

export default async function KlassenPage() {
  await requireUser();
  const classes = await getClasses();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Klassen</h1>
        <Link href="/lehrer/klassen/neu" className={buttonVariants()}>
          Neue Klasse
        </Link>
      </div>

      {classes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Sie haben noch keine Klassen angelegt. Legen Sie Ihre erste Klasse an.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {classes.map((schoolClass) => (
            <ClassCard key={schoolClass.id} schoolClass={schoolClass} />
          ))}
        </div>
      )}
    </main>
  );
}
