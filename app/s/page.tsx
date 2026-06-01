import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getCodenameById } from '@/lib/db/student-login';
import { getAssignedTopicsForStudent } from '@/lib/db/student-topics';
import { StudentTopicCard } from '@/components/student/StudentTopicCard';

// Schüler:innen-Dashboard (Phase G4): Themen-Karten statt einer flachen
// Modul-Liste. Sortierung: in_progress zuerst, dann open, dann done.
// Module ohne Thema werden nicht mehr gezeigt — Lehrer:innen können sie
// in der Klassen-Detailseite in der „Sonstiges"-Sektion sehen und ggf.
// einem Thema zuordnen.

export const metadata: Metadata = {
  title: 'Mein Bereich',
};

export default async function StudentDashboard() {
  const session = await requireStudentSession();
  const [codename, topics] = await Promise.all([
    getCodenameById(session.studentCodeId),
    getAssignedTopicsForStudent(session.classId, session.studentCodeId),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Hallo {codename ?? ''}!</h1>

      {topics.length === 0 ? (
        <p className="text-muted-foreground">
          Im Moment hast du keine Themen. Schau später wieder vorbei!
        </p>
      ) : (
        <>
          <h2 className="text-lg font-medium">Deine Lernpfade</h2>
          <div className="flex flex-col gap-3">
            {topics.map((topic) => (
              <StudentTopicCard key={topic.topicId} topic={topic} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
