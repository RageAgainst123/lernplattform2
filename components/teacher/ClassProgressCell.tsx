import { CheckIcon, CircleIcon, PencilIcon } from 'lucide-react';
import type { ProgressCell } from '@/lib/db/class-progress';

// Eine Zelle der Klassen-Fortschritts-Matrix. Status als Icon + Farbe; bei
// abgeschlossenen Modulen + vorhandener Maximalpunktzahl wird der Score
// (N/M) klein darunter angezeigt. Browser-Tooltip via `title` zeigt das
// Datum der letzten Aktivität.

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

function buildTitle(cell: ProgressCell): string {
  if (cell.status === 'done' && cell.completedAt) {
    return `Abgegeben am ${formatDate(cell.completedAt)}`;
  }
  if (cell.status === 'in_progress' && cell.lastActivityAt) {
    return `Zuletzt aktiv: ${formatDate(cell.lastActivityAt)}`;
  }
  return 'Noch nicht begonnen';
}

export function ClassProgressCell({ cell }: { cell: ProgressCell }) {
  const title = buildTitle(cell);

  if (cell.status === 'done') {
    const hasScore = cell.maxScore !== null && cell.maxScore > 0;
    return (
      <span
        title={title}
        className="bg-primary/10 text-primary inline-flex flex-col items-center rounded-md px-2 py-1 text-xs font-medium"
      >
        <span className="inline-flex items-center gap-1">
          <CheckIcon className="size-3.5" aria-hidden />
          Fertig
        </span>
        {hasScore && (
          <span className="text-[0.65rem] font-normal opacity-80">
            {cell.score}/{cell.maxScore}
          </span>
        )}
      </span>
    );
  }
  if (cell.status === 'in_progress') {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800"
      >
        <PencilIcon className="size-3.5" aria-hidden />
        Begonnen
      </span>
    );
  }
  return (
    <span
      title={title}
      className="text-muted-foreground inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs"
    >
      <CircleIcon className="size-3.5" aria-hidden />
      offen
    </span>
  );
}
