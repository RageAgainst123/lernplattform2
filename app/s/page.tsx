import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { studentLogout } from '@/lib/auth/student-actions';
import { getCodenameById } from '@/lib/db/student-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Mein Bereich',
};

export default async function StudentDashboard() {
  const session = await requireStudentSession();
  const codename = await getCodenameById(session.studentCodeId);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Hallo {codename ?? ''}!</h1>
        <form action={studentLogout}>
          <Button type="submit" variant="outline">
            Abmelden
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deine Module</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Hier erscheinen bald deine Aufgaben. Schau später wieder vorbei!
        </CardContent>
      </Card>
    </main>
  );
}
