import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getClassProgress } from '@/lib/db/class-progress';
import { ClassProgressMatrix } from '@/components/teacher/ClassProgressMatrix';

export const metadata: Metadata = {
  title: 'Klassen-Fortschritt — Lernplattform',
  robots: { index: false, follow: false },
};

export default async function ClassProgressPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);
  if (!schoolClass) {
    notFound();
  }
  const matrix = await getClassProgress(schoolClass.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <Link
        href={`/lehrer/klassen/${schoolClass.id}`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Zurück zur Klasse {schoolClass.name}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fortschritt · {schoolClass.name}</h1>
        <p className="text-muted-foreground text-sm">
          Übersicht: welche Schüler:in ist mit welchem Modul wie weit. Hovere über eine Zelle, um
          das Datum der letzten Aktivität zu sehen.
        </p>
      </div>

      <ClassProgressMatrix matrix={matrix} classId={id} />
    </div>
  );
}
