import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { studentLogout } from '@/lib/auth/student-actions';
import { getCodenameById } from '@/lib/db/student-login';
import { getAssignedModules } from '@/lib/db/student-modules';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/student/ModuleCard';

export const metadata: Metadata = {
  title: 'Mein Bereich',
};

export default async function StudentDashboard() {
  const session = await requireStudentSession();
  const [codename, modules] = await Promise.all([
    getCodenameById(session.studentCodeId),
    getAssignedModules(session.classId, session.studentCodeId),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Hallo {codename ?? ''}!</h1>
        <form action={studentLogout}>
          <Button type="submit" variant="outline">
            Abmelden
          </Button>
        </form>
      </div>

      <h2 className="text-lg font-medium">Deine Module</h2>
      {modules.length === 0 ? (
        <p className="text-muted-foreground">
          Im Moment hast du keine Aufgaben. Schau später wieder vorbei!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}
    </div>
  );
}
