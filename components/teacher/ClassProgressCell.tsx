import Link from 'next/link';
import {
  CheckIcon,
  CircleIcon,
  PencilIcon,
  RotateCcwIcon,
  MessageSquareIcon,
  XIcon,
} from 'lucide-react';
import type { ProgressCell } from '@/lib/db/class-progress';

// Eine Zelle der Klassen-Fortschritts-Matrix. Status als Icon + Farbe; bei
// abgeschlossenen Modulen zusätzlich bestanden/nicht-bestanden (wenn Schwelle)
// + Score (N/M). Klickbar → Detailseite der Abgabe. Browser-Tooltip via `title`.

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Score-Zusatz für den Tooltip: macht klar, dass N/M „richtig" bedeutet
// (nicht „N von M erledigt"). Nur wenn es bewertbare Aufgaben gibt.
function scoreHint(cell: ProgressCell): string {
  if (cell.maxScore !== null && cell.maxScore > 0) {
    return ` · ${cell.score}/${cell.maxScore} richtig`;
  }
  return '';
}

function buildTitle(cell: ProgressCell): string {
  if (cell.status === 'returned' && cell.returnedAt) {
    return `Zurückgegeben am ${formatDate(cell.returnedAt)}`;
  }
  if (cell.status === 'done' && cell.completedAt) {
    return `Abgegeben am ${formatDate(cell.completedAt)}${scoreHint(cell)}`;
  }
  if (cell.status === 'in_progress' && cell.lastActivityAt) {
    return `Zuletzt aktiv: ${formatDate(cell.lastActivityAt)}`;
  }
  return 'Noch nicht begonnen';
}

const SCORE = 'text-[0.65rem] font-normal opacity-80';

function DoneBadge({ cell }: { cell: ProgressCell }) {
  const hasScore = cell.maxScore !== null && cell.maxScore > 0;
  const score = hasScore && (
    <span className={SCORE}>
      {cell.score}/{cell.maxScore}
    </span>
  );
  // Bestanden / nicht bestanden, wenn eine Schwelle gesetzt ist.
  if (cell.passed === true) {
    return (
      <span className="inline-flex flex-col items-center rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-800">
        <span className="inline-flex items-center gap-1">
          <CheckIcon className="size-3.5" aria-hidden />
          Bestanden
        </span>
        {score}
      </span>
    );
  }
  if (cell.passed === false) {
    return (
      <span className="inline-flex flex-col items-center rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-800">
        <span className="inline-flex items-center gap-1">
          <XIcon className="size-3.5" aria-hidden />
          Nicht bestanden
        </span>
        {score}
      </span>
    );
  }
  // Keine Schwelle → neutrales „Fertig".
  return (
    <span className="bg-primary/10 text-primary inline-flex flex-col items-center rounded-md px-2 py-1 text-xs font-medium">
      <span className="inline-flex items-center gap-1">
        <CheckIcon className="size-3.5" aria-hidden />
        Fertig
      </span>
      {score}
    </span>
  );
}

function ReturnedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
      <RotateCcwIcon className="size-3.5" aria-hidden />
      Zurückgegeben
    </span>
  );
}

function InProgressBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
      <PencilIcon className="size-3.5" aria-hidden />
      Begonnen
    </span>
  );
}

function OpenBadge() {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs">
      <CircleIcon className="size-3.5" aria-hidden />
      offen
    </span>
  );
}

function CellBadge({ cell }: { cell: ProgressCell }) {
  if (cell.status === 'done') return <DoneBadge cell={cell} />;
  if (cell.status === 'returned') return <ReturnedBadge />;
  if (cell.status === 'in_progress') return <InProgressBadge />;
  return <OpenBadge />;
}

export function ClassProgressCell({ cell, classId }: { cell: ProgressCell; classId: string }) {
  const title = buildTitle(cell);
  const inner = (
    <span className="inline-flex items-center gap-1">
      <CellBadge cell={cell} />
      {cell.hasFeedback && (
        <MessageSquareIcon className="text-muted-foreground size-3.5" aria-hidden />
      )}
    </span>
  );

  // Offene Zellen (keine Abgabe) sind nicht verlinkt.
  if (cell.status === 'open') {
    return <span title={title}>{inner}</span>;
  }
  return (
    <Link
      href={`/lehrer/klassen/${classId}/fortschritt/${cell.studentCodeId}/${cell.moduleId}`}
      title={title}
      className="inline-block rounded-md hover:opacity-80"
    >
      {inner}
    </Link>
  );
}
