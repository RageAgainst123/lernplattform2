'use client';

import Link from 'next/link';
import { ArrowRightIcon, PlayIcon, TrashIcon } from 'lucide-react';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';

// Sub-Bausteine von AssignedModulesList (Phase E): Sektion + Row pro Aktivität.
// Ausgelagert damit die Haupt-Datei unter dem 200-Zeilen-Limit bleibt.

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

function MetaLine({ m }: { m: AssignedModuleForTeacher }) {
  return (
    <p className="text-muted-foreground text-xs">
      {m.schulstufe ? `${m.schulstufe}. SSt.` : 'keine Stufe'}
      {m.topic && ` · ${m.topic}`}
      {m.dueDate && ` · fällig: ${formatDate(m.dueDate)}`}
    </p>
  );
}

function RemoveButton({
  moduleId,
  title,
  pending,
  onRemove,
}: {
  moduleId: string;
  title: string;
  pending: boolean;
  onRemove: (moduleId: string, title: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRemove(moduleId, title)}
      disabled={pending}
      aria-label={`„${title}" entfernen`}
      className="text-muted-foreground hover:text-destructive rounded-md p-1.5"
    >
      <TrashIcon className="size-4" aria-hidden />
    </button>
  );
}

type RowProps = {
  module: AssignedModuleForTeacher;
  classId: string;
  pending: boolean;
  onRemove: (moduleId: string, title: string) => void;
};

function LernmodulRow({ module: m, classId, pending, onRemove }: RowProps) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.title}</p>
        <MetaLine m={m} />
      </div>
      <Link
        href={`/lehrer/klassen/${classId}/fortschritt#${m.moduleId}`}
        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
      >
        Fortschritt
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
      <RemoveButton moduleId={m.moduleId} title={m.title} pending={pending} onRemove={onRemove} />
    </li>
  );
}

function PraesentationRow({ module: m, classId, pending, onRemove }: RowProps) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.title}</p>
        <MetaLine m={m} />
      </div>
      <Link
        href={`/lehrer/klassen/${classId}/praesentation/${m.moduleId}`}
        className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <PlayIcon className="size-3.5" aria-hidden />
        Präsentieren
      </Link>
      <RemoveButton moduleId={m.moduleId} title={m.title} pending={pending} onRemove={onRemove} />
    </li>
  );
}

type SectionProps = {
  title: string;
  emoji: string;
  items: AssignedModuleForTeacher[];
  classId: string;
  pending: boolean;
  onRemove: (moduleId: string, title: string) => void;
};

export function LernmodulSection({
  title,
  emoji,
  items,
  classId,
  pending,
  onRemove,
}: SectionProps) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        <span aria-hidden>{emoji}</span>
        {title} ({items.length})
      </h3>
      <ul className="divide-y rounded-md border">
        {items.map((m) => (
          <LernmodulRow
            key={m.moduleId}
            module={m}
            classId={classId}
            pending={pending}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}

export function PraesentationSection({
  title,
  emoji,
  items,
  classId,
  pending,
  onRemove,
}: SectionProps) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        <span aria-hidden>{emoji}</span>
        {title} ({items.length})
      </h3>
      <ul className="divide-y rounded-md border">
        {items.map((m) => (
          <PraesentationRow
            key={m.moduleId}
            module={m}
            classId={classId}
            pending={pending}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}
