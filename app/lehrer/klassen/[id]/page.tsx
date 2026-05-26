import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getStudentCodes } from '@/lib/db/student-codes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentCodesPanel } from '@/components/teacher/StudentCodesPanel';
import { JoinCodeHint } from '@/components/teacher/JoinCodeHint';

export const metadata: Metadata = {
  title: 'Klasse — Lernplattform',
};

export default async function KlasseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);

  if (!schoolClass) {
    notFound();
  }

  const codes = await getStudentCodes(schoolClass.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <Link href="/lehrer/klassen" className="text-muted-foreground text-sm hover:underline">
        ← Zurück zu den Klassen
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{schoolClass.name}</h1>
        <p className="text-muted-foreground text-sm">
          {schoolClass.schulstufe
            ? `${schoolClass.schulstufe}. Schulstufe`
            : 'Keine Schulstufe angegeben'}
        </p>
      </div>

      <JoinCodeHint joinCode={schoolClass.joinCode} />

      <Card>
        <CardHeader>
          <CardTitle>Schüler:innen-Codes</CardTitle>
          <CardDescription>Anonyme Zugangscodes für diese Klasse.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentCodesPanel classId={schoolClass.id} className={schoolClass.name} codes={codes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module</CardTitle>
          <CardDescription>Dieser Klasse zugewiesene Lerneinheiten.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Modul-Zuweisung folgt in einem späteren Schritt.
        </CardContent>
      </Card>
    </main>
  );
}
