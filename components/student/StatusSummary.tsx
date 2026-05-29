import { CheckIcon, CircleIcon, PencilIcon } from 'lucide-react';
import type { StatusCounts } from '@/lib/db/student-modules-status';

// Übersichts-Pille oben auf dem Schüler:innen-Dashboard:
// „2 offen · 1 in Bearbeitung · 4 erledigt"
// Status-Stufen mit 0 Modulen werden ausgeblendet, damit die Zeile knapp
// bleibt. Bei 0 Modulen insgesamt rendert die Komponente nichts.

type Segment = {
  count: number;
  label: string;
  icon: typeof CheckIcon;
  className: string;
};

function buildSegments(counts: StatusCounts): Segment[] {
  return [
    {
      count: counts.in_progress,
      label: 'in Bearbeitung',
      icon: PencilIcon,
      className: 'text-yellow-800',
    },
    { count: counts.open, label: 'offen', icon: CircleIcon, className: 'text-primary' },
    {
      count: counts.done,
      label: 'erledigt',
      icon: CheckIcon,
      className: 'text-muted-foreground',
    },
  ].filter((s) => s.count > 0);
}

export function StatusSummary({ counts }: { counts: StatusCounts }) {
  const segments = buildSegments(counts);
  if (segments.length === 0) return null;
  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md p-3 text-sm">
      {segments.map((s, i) => {
        const Icon = s.icon;
        return (
          <span key={s.label} className={`flex items-center gap-1.5 ${s.className}`}>
            <Icon className="size-4" aria-hidden />
            <strong>{s.count}</strong> {s.label}
            {i < segments.length - 1 && (
              <span aria-hidden className="text-muted-foreground ml-2">
                ·
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
