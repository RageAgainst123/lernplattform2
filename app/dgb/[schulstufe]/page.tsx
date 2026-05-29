import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { isSekundarstufe } from '@/lib/curriculum';
import { getStufeWithBereiche } from '@/lib/db/public-content-stufe';
import { STUDENT_COOKIE, verifyStudentSession } from '@/lib/auth/student-session';
import { Breadcrumb } from '@/components/public/Breadcrumb';
import { BereichAccordion } from '@/components/public/BereichAccordion';

export const metadata: Metadata = {
  title: 'Schulstufe — Digitale Grundbildung',
};

export default async function SchulstufePage({
  params,
}: {
  params: Promise<{ schulstufe: string }>;
}) {
  const { schulstufe } = await params;
  const stufe = Number(schulstufe);
  if (!Number.isInteger(stufe) || !isSekundarstufe(stufe)) {
    notFound();
  }

  const [bereiche, studentLoggedIn] = await Promise.all([
    getStufeWithBereiche(stufe),
    isStudentLoggedIn(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <Breadcrumb
        parentHref="/dgb"
        parentLabel="Digitale Grundbildung"
        current={`${stufe}. Schulstufe`}
      />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{stufe}. Schulstufe</h1>
        <p className="text-muted-foreground mt-1">
          Wähle einen Kompetenzbereich. Klicke auf ein Thema, um Arbeitsblätter und Module zu sehen.
        </p>
      </header>
      <BereichAccordion bereiche={bereiche} studentLoggedIn={studentLoggedIn} />
    </div>
  );
}

// Prüft, ob die Schüler:innen-Session gültig ist (für die „Online ausfüllen"-Buttons).
async function isStudentLoggedIn(): Promise<boolean> {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return false;
  const session = await verifyStudentSession(token);
  return session !== null;
}
