import Link from 'next/link';
import type { AssignedTopicForTeacher, TopicModuleEntry } from '@/lib/db/class-topics';
import type { ActivityKind } from '@/lib/schemas/entities';
import { ACTIVITY_INFO } from '@/lib/activities';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicRemoveButton } from './TopicRemoveButton';

// Themen-Karte für die Lehrer:innen-Sicht (Phase G3). Drei Sektionen pro
// Karte: Präsentationen (oben, abgesetzt — nur für die Lehrer:in zum
// Stundeneinstieg), Lernpfad (Lernmodule + Quiz + Abschlusstest in
// Reihenfolge, das was Schüler:innen sehen), Entfernen-Aktion ganz unten.

// Reihenfolge im Lernpfad: Lernmodule → Quiz → Abschlusstest.
// Präsentationen sind kein Teil des Schüler-Pfades.
const STUDENT_PATH_ORDER: ActivityKind[] = ['lernmodul', 'quiz', 'abschlusstest'];

type Props = {
  classId: string;
  topic: AssignedTopicForTeacher;
};

export function TopicCard({ classId, topic }: Props) {
  const presentations = topic.modulesByKind.praesentation;
  const studentPath = STUDENT_PATH_ORDER.flatMap((k) => topic.modulesByKind[k]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl" aria-hidden>
                📚
              </span>
              {topic.label}
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {topic.schulstufe ? `${topic.schulstufe}. Stufe` : 'keine Stufe'}
              {topic.kompetenzbereich
                ? ` · ${KOMPETENZBEREICH_INFO[topic.kompetenzbereich].label}`
                : ''}
            </p>
            {topic.description && (
              <p className="text-muted-foreground mt-1 text-sm">{topic.description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {presentations.length > 0 && (
          <TeacherOnlySection classId={classId} entries={presentations} />
        )}
        <StudentPathSection entries={studentPath} />
        <div className="flex justify-end pt-2">
          <TopicRemoveButton classId={classId} topicId={topic.topicId} topicLabel={topic.label} />
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherOnlySection({
  classId,
  entries,
}: {
  classId: string;
  entries: TopicModuleEntry[];
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <h3 className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <span aria-hidden>🎬</span>
        Für deinen Stunden-Einstieg
      </h3>
      <p className="mt-0.5 text-xs text-amber-800/80">
        Nur du siehst diesen Block — startet eine Live-Stunde mit Schüler:innen-Geräten.
      </p>
      <ul className="mt-2 space-y-1">
        {entries.map((m) => (
          <li key={m.moduleId} className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-amber-900">{m.title}</span>
            <Link
              href={`/lehrer/klassen/${classId}/praesentation/${m.moduleId}`}
              className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              Präsentieren
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudentPathSection({ entries }: { entries: TopicModuleEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
        Noch keine Lernmodule für Schüler:innen in diesem Thema.
      </p>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-medium">Lernpfad für Schüler:innen</h3>
      <ol className="mt-2 space-y-1.5">
        {entries.map((m, i) => (
          <StudentPathItem key={m.moduleId} entry={m} index={i + 1} />
        ))}
      </ol>
    </div>
  );
}

function StudentPathItem({ entry, index }: { entry: TopicModuleEntry; index: number }) {
  const info = ACTIVITY_INFO[entry.activityKind];
  return (
    <li className="hover:bg-muted/40 flex items-center gap-3 rounded-md border px-3 py-2">
      <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">{index}.</span>
      <span aria-hidden className="text-base">
        {info.iconEmoji}
      </span>
      <span className="flex-1 truncate text-sm">{entry.title}</span>
      {entry.dueDate && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          fällig {entry.dueDate}
        </span>
      )}
    </li>
  );
}
