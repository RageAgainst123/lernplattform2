import Link from 'next/link';
import { CheckIcon, PencilIcon, ArrowRightIcon, RotateCcwIcon } from 'lucide-react';
import type { AssignedModule } from '@/lib/db/student-modules';
import type { ModuleStatus } from '@/lib/db/student-modules-status';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Zeigt ein Schüler:innen-Dashboard-Modul mit Status-Badge + Karten-Style:
//   - 'open': kein Badge, linker Akzentrand → „los geht's"
//   - 'in_progress': gelbes Badge + linker Akzentrand + „Weitermachen"-Hinweis
//   - 'returned': amber Badge + amber Akzentrand → „bitte überarbeiten"
//   - 'done': Erledigt-Badge, leicht gedimmt → ans Ende sortiert
//
// Ziel: Schüler:innen sehen auf einen Blick was noch zu tun ist.

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === 'done') {
    return (
      <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
        <CheckIcon className="size-3.5" aria-hidden />
        Erledigt
      </span>
    );
  }
  if (status === 'returned') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
        <RotateCcwIcon className="size-3.5" aria-hidden />
        Zur Überarbeitung
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800">
        <PencilIcon className="size-3.5" aria-hidden />
        In Bearbeitung
      </span>
    );
  }
  return null;
}

function CardCta({ status }: { status: ModuleStatus }) {
  if (status === 'done') return null;
  const label =
    status === 'returned' ? 'Überarbeiten' : status === 'in_progress' ? 'Weitermachen' : 'Starten';
  return (
    <p className="text-primary mt-2 flex items-center gap-1 text-sm font-medium">
      {label}
      <ArrowRightIcon className="size-4" aria-hidden />
    </p>
  );
}

// Tailwind-Klassen je Status. Akzentrand links für aktive Module, gedimmt
// für erledigte → Auge sieht: hier passiert was, hier ist fertig.
function cardClassesFor(status: ModuleStatus): string {
  const base = 'transition-colors';
  if (status === 'done') {
    return `${base} hover:bg-muted/50 opacity-70`;
  }
  if (status === 'returned') {
    // zurückgegeben: amber Akzentbalken — sticht hervor, ist dringend
    return `${base} hover:bg-muted/50 border-l-4 border-l-amber-400`;
  }
  // open + in_progress: linker Akzentbalken
  return `${base} hover:bg-muted/50 border-l-4 border-l-primary`;
}

export function ModuleCard({ module }: { module: AssignedModule }) {
  return (
    <Link href={`/s/modul/${module.id}`} className="block">
      <Card className={cardClassesFor(module.status)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-xl">
            <span>{module.title}</span>
            <StatusBadge status={module.status} />
          </CardTitle>
          {module.description && <CardDescription>{module.description}</CardDescription>}
          <CardCta status={module.status} />
        </CardHeader>
      </Card>
    </Link>
  );
}
