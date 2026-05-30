import { CheckIcon, CircleIcon, PencilIcon, RotateCcwIcon } from 'lucide-react';
import { ClassProgressCell } from '@/components/teacher/ClassProgressCell';
import {
  countMatrixStatuses,
  getCellOrOpen,
  type ClassProgressMatrix as Matrix,
} from '@/lib/db/class-progress';

// Matrix-Darstellung der Klassen-Fortschritts-Daten. Server-Komponente —
// rein read-only. Sticky-First-Column für Codenamen + horizontaler Scroll
// bei vielen Modulen.

function StatusSummary({ matrix }: { matrix: Matrix }) {
  const counts = countMatrixStatuses(matrix);
  const total = counts.done + counts.in_progress + counts.returned + counts.open;
  if (total === 0) return null;
  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md p-3 text-sm">
      <span className="text-primary flex items-center gap-1.5">
        <CheckIcon className="size-4" aria-hidden />
        <strong>{counts.done}</strong> fertig
      </span>
      <span className="flex items-center gap-1.5 text-yellow-800">
        <PencilIcon className="size-4" aria-hidden />
        <strong>{counts.in_progress}</strong> in Bearbeitung
      </span>
      {counts.returned > 0 && (
        <span className="flex items-center gap-1.5 text-amber-700">
          <RotateCcwIcon className="size-4" aria-hidden />
          <strong>{counts.returned}</strong> zurückgegeben
        </span>
      )}
      <span className="text-muted-foreground flex items-center gap-1.5">
        <CircleIcon className="size-4" aria-hidden />
        <strong>{counts.open}</strong> offen
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
      {message}
    </p>
  );
}

function ModuleHeaderCell({
  moduleId,
  title,
  schulstufe,
}: {
  moduleId: string;
  title: string;
  schulstufe: number | null;
}) {
  return (
    <th
      scope="col"
      id={moduleId}
      className="border-r p-3 text-left text-xs font-semibold last:border-r-0"
    >
      <div className="max-w-[180px]">
        <p className="truncate" title={title}>
          {title}
        </p>
        {schulstufe && (
          <p className="text-muted-foreground text-[0.65rem] font-normal">{schulstufe}. SSt.</p>
        )}
      </div>
    </th>
  );
}

function MatrixTable({ matrix, classId }: { matrix: Matrix; classId: string }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th
              scope="col"
              className="bg-muted/30 sticky left-0 z-10 border-r p-3 text-left text-xs font-semibold tracking-wide uppercase"
            >
              Codename
            </th>
            {matrix.modules.map((m) => (
              <ModuleHeaderCell
                key={m.moduleId}
                moduleId={m.moduleId}
                title={m.title}
                schulstufe={m.schulstufe}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.students.map((student) => (
            <tr key={student.id} className="border-t">
              <th
                scope="row"
                className="bg-background sticky left-0 border-r p-3 text-left font-medium"
              >
                {student.codename}
              </th>
              {matrix.modules.map((m) => (
                <td key={m.moduleId} className="border-r p-3 last:border-r-0">
                  <ClassProgressCell
                    cell={getCellOrOpen(matrix, student.id, m.moduleId)}
                    classId={classId}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClassProgressMatrix({ matrix, classId }: { matrix: Matrix; classId: string }) {
  if (matrix.modules.length === 0) {
    return (
      <EmptyState message="Dieser Klasse ist noch kein Modul zugewiesen. Gehe zur Klassen-Übersicht und füge eines hinzu." />
    );
  }
  if (matrix.students.length === 0) {
    return (
      <EmptyState message="Diese Klasse hat noch keine Schüler:innen-Codes. Lege welche an und verteile sie an die Klasse." />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <StatusSummary matrix={matrix} />
      <MatrixTable matrix={matrix} classId={classId} />
    </div>
  );
}
