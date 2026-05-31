'use client';

import Link from 'next/link';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import { ACTIVITY_INFO } from '@/lib/activities';
import {
  LernmodulSection,
  PraesentationSection,
} from '@/components/teacher/AssignedModulesSections';

// Zugewiesene Aktivitäten, gruppiert nach Lernmodul vs Präsentation (Phase E).
// Vorher war alles in einer Liste — Lehrer:innen mussten am DisplayMode-Badge
// erraten ob „Präsentieren" oder „Fortschritt" der nächste Klick ist. Jetzt
// klare visuelle Trennung mit passenden Aktionen pro Sektion. Row+Section-Code
// liegt in AssignedModulesSections.tsx (Zeilen-Limit dieser Datei).

export function AssignedModulesList({
  classId,
  assigned,
  pending,
  onRemove,
}: {
  classId: string;
  assigned: AssignedModuleForTeacher[];
  pending: boolean;
  onRemove: (moduleId: string, title: string) => void;
}) {
  if (assigned.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Dieser Klasse ist noch nichts zugewiesen. Wähle oben ein Lernmodul oder eine Präsentation.
      </p>
    );
  }
  const lernmodule = assigned.filter((m) => m.activityKind === 'lernmodul');
  const praesentationen = assigned.filter((m) => m.activityKind === 'praesentation');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Link
          href={`/lehrer/klassen/${classId}/fortschritt`}
          className="text-primary text-sm hover:underline"
        >
          Klassen-Fortschritt ansehen →
        </Link>
      </div>
      <LernmodulSection
        title={ACTIVITY_INFO.lernmodul.plural}
        emoji={ACTIVITY_INFO.lernmodul.iconEmoji}
        items={lernmodule}
        classId={classId}
        pending={pending}
        onRemove={onRemove}
      />
      <PraesentationSection
        title={ACTIVITY_INFO.praesentation.plural}
        emoji={ACTIVITY_INFO.praesentation.iconEmoji}
        items={praesentationen}
        classId={classId}
        pending={pending}
        onRemove={onRemove}
      />
    </div>
  );
}
