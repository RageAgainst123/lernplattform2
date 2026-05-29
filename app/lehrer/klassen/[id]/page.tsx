import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getStudentCodes } from '@/lib/db/student-codes';
import { getAssignedModulesForClass } from '@/lib/db/class-modules';
import { getPublishedModulesAll, type PublishedModuleOption } from '@/lib/db/modules';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { Class, StudentCode } from '@/lib/schemas/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentCodesPanel } from '@/components/teacher/StudentCodesPanel';
import { JoinCodeHint } from '@/components/teacher/JoinCodeHint';
import { ModuleAssignmentPanel } from '@/components/teacher/ModuleAssignmentPanel';

export const metadata: Metadata = {
  title: 'Klasse — Lernplattform',
};

function ClassHeader({ schoolClass }: { schoolClass: Class }) {
  return (
    <>
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
    </>
  );
}

function StudentCodesCard({
  classId,
  className,
  codes,
}: {
  classId: string;
  className: string;
  codes: StudentCode[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schüler:innen-Codes</CardTitle>
        <CardDescription>Anonyme Zugangscodes für diese Klasse.</CardDescription>
      </CardHeader>
      <CardContent>
        <StudentCodesPanel classId={classId} className={className} codes={codes} />
      </CardContent>
    </Card>
  );
}

function ModulesCard({
  classId,
  assigned,
  available,
}: {
  classId: string;
  assigned: AssignedModuleForTeacher[];
  available: PublishedModuleOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Module</CardTitle>
        <CardDescription>
          Lerneinheiten dieser Klasse zuweisen und den Fortschritt verfolgen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ModuleAssignmentPanel classId={classId} assigned={assigned} available={available} />
      </CardContent>
    </Card>
  );
}

export default async function KlasseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);
  if (!schoolClass) notFound();
  const [codes, assignedModules, availableModules] = await Promise.all([
    getStudentCodes(schoolClass.id),
    getAssignedModulesForClass(schoolClass.id),
    getPublishedModulesAll(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <ClassHeader schoolClass={schoolClass} />
      <StudentCodesCard classId={schoolClass.id} className={schoolClass.name} codes={codes} />
      <ModulesCard
        classId={schoolClass.id}
        assigned={assignedModules}
        available={availableModules}
      />
    </div>
  );
}
