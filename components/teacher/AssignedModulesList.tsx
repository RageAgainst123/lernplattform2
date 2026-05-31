'use client';

import Link from 'next/link';
import { ArrowRightIcon, PlayIcon, TrashIcon } from 'lucide-react';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';

// Read-only-Liste der zugewiesenen Module. Sub-Bausteine von
// ModuleAssignmentPanel — extra ausgelagert, damit der Panel-File <200 Z. bleibt.

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function AssignedRow({
  module: m,
  classId,
  pending,
  onRemove,
}: {
  module: AssignedModuleForTeacher;
  classId: string;
  pending: boolean;
  onRemove: (moduleId: string, title: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.title}</p>
        <p className="text-muted-foreground text-xs">
          {m.schulstufe ? `${m.schulstufe}. SSt.` : 'keine Stufe'}
          {m.topic && ` · ${m.topic}`}
          {m.dueDate && ` · fällig: ${formatDate(m.dueDate)}`}
        </p>
      </div>
      {m.displayMode === 'presentation' && (
        <Link
          href={`/lehrer/klassen/${classId}/praesentation/${m.moduleId}`}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          <PlayIcon className="size-3.5" aria-hidden />
          Präsentieren
        </Link>
      )}
      <Link
        href={`/lehrer/klassen/${classId}/fortschritt#${m.moduleId}`}
        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
      >
        Fortschritt
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
      <button
        type="button"
        onClick={() => onRemove(m.moduleId, m.title)}
        disabled={pending}
        aria-label={`Modul "${m.title}" entfernen`}
        className="text-muted-foreground hover:text-destructive rounded-md p-1.5"
      >
        <TrashIcon className="size-4" aria-hidden />
      </button>
    </li>
  );
}

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
        Dieser Klasse ist noch kein Modul zugewiesen. Wähle eines oben aus.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Zugewiesene Module ({assigned.length})</p>
        <Link
          href={`/lehrer/klassen/${classId}/fortschritt`}
          className="text-primary text-sm hover:underline"
        >
          Klassen-Fortschritt ansehen →
        </Link>
      </div>
      <ul className="divide-y rounded-md border">
        {assigned.map((m) => (
          <AssignedRow
            key={m.moduleId}
            module={m}
            classId={classId}
            pending={pending}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
}
