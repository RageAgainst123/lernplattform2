import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/teacher-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewClassForm } from '@/components/teacher/NewClassForm';

export const metadata: Metadata = {
  title: 'Neue Klasse — Lernplattform',
};

export default async function NeueKlassePage() {
  await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-8">
      <Link href="/lehrer/klassen" className="text-muted-foreground text-sm hover:underline">
        ← Zurück zu den Klassen
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Neue Klasse anlegen</CardTitle>
          <CardDescription>
            Vergeben Sie einen Namen. Die Schulstufe ist optional und kann später ergänzt werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClassForm />
        </CardContent>
      </Card>
    </main>
  );
}
