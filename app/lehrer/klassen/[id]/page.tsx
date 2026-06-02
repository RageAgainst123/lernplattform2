import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/teacher-auth';
import { getClass } from '@/lib/db/classes';
import { getStudentCodes } from '@/lib/db/student-codes';
import { isPresentationLiveForTeacher } from '@/lib/db/live-sessions';
import { getAssignedModulesForClass } from '@/lib/db/class-modules';
import { getPublishedModulesAll, type PublishedModuleOption } from '@/lib/db/modules';
import {
  getAssignedTopicsForClass,
  getPublishedTopicsAll,
  type AssignedTopicForTeacher,
  type PublishedTopicOption,
  type TopicModuleEntry,
} from '@/lib/db/class-topics';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { Class, StudentCode } from '@/lib/schemas/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentCodesPanel } from '@/components/teacher/StudentCodesPanel';
import { JoinCodeHint } from '@/components/teacher/JoinCodeHint';
import { ModuleAssignmentPanel } from '@/components/teacher/ModuleAssignmentPanel';
import { LiveSessionBanner } from '@/components/teacher/LiveSessionBanner';
import { TopicCard } from '@/components/teacher/TopicCard';
import { TopicAssignmentPanel } from '@/components/teacher/TopicAssignmentPanel';
import { DeleteClassButton } from '@/components/teacher/DeleteClassButton';

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
      <JoinCodeHint joinCode={schoolClass.joinCode} classId={schoolClass.id} />
    </>
  );
}

function DangerZone({ classId, className }: { classId: string; className: string }) {
  return (
    <section className="border-destructive/30 mt-12 rounded-md border border-dashed p-4">
      <h2 className="text-muted-foreground mb-2 text-sm font-medium">Gefahrenzone</h2>
      <DeleteClassButton classId={classId} className={className} />
    </section>
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

// Themen-Sektion (Phase G3): empfohlener Hauptpfad. Oben das Zuweisungs-Panel,
// darunter pro zugewiesenem Thema eine eigene TopicCard mit Präsentations-
// Block + Lernpfad + Entfernen-Aktion.
function TopicsSection({
  classId,
  topics,
  availableTopics,
}: {
  classId: string;
  topics: AssignedTopicForTeacher[];
  availableTopics: PublishedTopicOption[];
}) {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📚 Themen für diese Klasse</CardTitle>
          <CardDescription>
            Ein Thema enthält Präsentation, Lernmodule, Quiz und Abschlusstest. Empfohlener Weg —
            Schüler:innen sehen es als Lernpfad-Karte im Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicAssignmentPanel
            classId={classId}
            available={availableTopics}
            alreadyAssignedIds={topics.map((t) => t.topicId)}
          />
        </CardContent>
      </Card>
      {topics.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
          Noch kein Thema zugewiesen. Wähle oben eines aus der Liste.
        </p>
      ) : (
        <div className="space-y-4">
          {topics.map((t) => (
            <TopicCard key={t.topicId} classId={classId} topic={t} />
          ))}
        </div>
      )}
    </section>
  );
}

// Sonstiges-Sektion: Module die einer Klasse direkt zugewiesen sind aber zu
// keinem Thema gehören (Legacy-Workflow). Bestehende ModuleAssignmentPanel
// bleibt für Edge-Cases und granulare Steuerung (Fälligkeit + Schwelle).
function OrphansSection({
  classId,
  orphanModules,
  available,
  fullAssigned,
}: {
  classId: string;
  orphanModules: TopicModuleEntry[];
  available: PublishedModuleOption[];
  fullAssigned: AssignedModuleForTeacher[];
}) {
  // Wir zeigen das Modul-Panel nur, wenn es Sinn ergibt: entweder gibt es
  // bereits Orphan-Module ODER es gibt verfügbare nicht-themen-Module die
  // man einzeln zuweisen könnte. Sonst Pannel kollabiert visuell.
  if (orphanModules.length === 0 && fullAssigned.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Einzel-Module (ohne Thema)</CardTitle>
        <CardDescription>
          Lernmodule die nicht zu einem Lernpfad gehören. Granulare Steuerung von Fälligkeit und
          Bestehens-Schwelle. Wenn möglich besser ein Thema zuweisen — das ist klarer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ModuleAssignmentPanel classId={classId} assigned={fullAssigned} available={available} />
      </CardContent>
    </Card>
  );
}

export default async function KlasseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const schoolClass = await getClass(id);
  if (!schoolClass) notFound();
  const [codes, assignedModules, availableModules, isLive, topicsData, availableTopics] =
    await Promise.all([
      getStudentCodes(schoolClass.id),
      getAssignedModulesForClass(schoolClass.id),
      getPublishedModulesAll(),
      isPresentationLiveForTeacher(schoolClass.id),
      getAssignedTopicsForClass(schoolClass.id),
      getPublishedTopicsAll(),
    ]);

  // Module die zu einem Thema gehören aus der „Sonstiges"-Liste rausfiltern —
  // sonst tauchen sie doppelt auf (einmal im Thema, einmal flach).
  const orphanModuleIds = new Set(topicsData.orphanModules.map((m) => m.moduleId));
  const orphanFullAssigned = assignedModules.filter((m) => orphanModuleIds.has(m.moduleId));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <ClassHeader schoolClass={schoolClass} />
      {isLive && <LiveSessionBanner classId={schoolClass.id} />}
      <StudentCodesCard classId={schoolClass.id} className={schoolClass.name} codes={codes} />
      <TopicsSection
        classId={schoolClass.id}
        topics={topicsData.topics}
        availableTopics={availableTopics}
      />
      <OrphansSection
        classId={schoolClass.id}
        orphanModules={topicsData.orphanModules}
        available={availableModules}
        fullAssigned={orphanFullAssigned}
      />
      <DangerZone classId={schoolClass.id} className={schoolClass.name} />
    </div>
  );
}
