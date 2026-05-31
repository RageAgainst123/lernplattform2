import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getCodenameById } from '@/lib/db/student-login';
import { getAssignedModules } from '@/lib/db/student-modules';
import { countByStatus, sortByStatus } from '@/lib/db/student-modules-status';
import { ModuleCard } from '@/components/student/ModuleCard';
import { StatusSummary } from '@/components/student/StatusSummary';

// Schüler:innen-Dashboard: zugewiesene Module auf einen Blick. Reihenfolge
// in_progress → open → done; Übersichts-Pille zeigt die Counts. Abmelden
// lebt im Header (SiteHeader.HeaderAuthDesktop), nicht hier.

export const metadata: Metadata = {
  title: 'Mein Bereich',
};

export default async function StudentDashboard() {
  const session = await requireStudentSession();
  const [codename, modules] = await Promise.all([
    getCodenameById(session.studentCodeId),
    getAssignedModules(session.classId, session.studentCodeId),
  ]);
  const counts = countByStatus(modules);
  const sorted = sortByStatus(modules);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Hallo {codename ?? ''}!</h1>

      {modules.length === 0 ? (
        <p className="text-muted-foreground">
          Im Moment hast du keine Aufgaben. Schau später wieder vorbei!
        </p>
      ) : (
        <>
          <StatusSummary counts={counts} />
          <h2 className="text-lg font-medium">Deine Lernmodule</h2>
          <div className="flex flex-col gap-3">
            {sorted.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
