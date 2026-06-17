import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleAssignmentPanel } from '@/components/teacher/ModuleAssignmentPanel';
import { TopicCard } from '@/components/teacher/TopicCard';
import { TopicAssignmentPanel } from '@/components/teacher/TopicAssignmentPanel';
import { WordHeftMatrix } from '@/components/teacher/WordHeftMatrix';
import { DeleteClassButton } from '@/components/teacher/DeleteClassButton';
import { StudentCodesPanel } from '@/components/teacher/StudentCodesPanel';
import type {
  AssignedTopicForTeacher,
  PublishedTopicOption,
  TopicModuleEntry,
} from '@/lib/db/class-topics';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { PublishedModuleOption } from '@/lib/db/modules';
import type { StudentCode, WordHeftLink } from '@/lib/schemas/entities';

// Phase Q5: Sub-Komponenten der Klassen-Detail-Seite ausgelagert um
// app/lehrer/klassen/[id]/page.tsx unter dem 200-Zeilen-Limit zu halten.

export function StudentCodesCard({
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

// Themen-Sektion (Phase G3): empfohlener Hauptpfad.
export function TopicsSection({
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
// keinem Thema gehören (Legacy-Workflow).
export function OrphansSection({
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
  if (orphanModules.length === 0 && fullAssigned.length === 0) return null;
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

// Phase Q5: Word-Heft-Übersicht. Nur sichtbar wenn es SSO-Schüler:innen gibt.
export function WordHeftSection({
  codes,
  links,
  isTeacherSsoAuth,
}: {
  codes: StudentCode[];
  links: WordHeftLink[];
  isTeacherSsoAuth: boolean;
}) {
  const hasSsoStudents = codes.some((c) => c.o365Email);
  if (!hasSsoStudents) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>📓 Word-Schulübungshefte</CardTitle>
        <CardDescription>
          Word-Hefte der Schüler:innen die mit Microsoft 365 angemeldet sind. Klick auf &bdquo;Heft
          öffnen&ldquo; öffnet das Heft in Word-Web (neuer Tab).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WordHeftMatrix codes={codes} links={links} isTeacherSsoAuth={isTeacherSsoAuth} />
      </CardContent>
    </Card>
  );
}

export function DangerZone({ classId, className }: { classId: string; className: string }) {
  return (
    <section className="border-destructive/30 mt-12 rounded-md border border-dashed p-4">
      <h2 className="text-muted-foreground mb-2 text-sm font-medium">Gefahrenzone</h2>
      <DeleteClassButton classId={classId} className={className} />
    </section>
  );
}
