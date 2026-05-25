import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/teacher-auth';
import { signOut } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard — Lernplattform',
};

export default async function LehrerDashboard() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Abmelden
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen</CardTitle>
          <CardDescription>Sie sind angemeldet als {user.email}.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Hier entstehen als Nächstes Ihre Klassen, zugewiesene Module und die Auswertungen.
        </CardContent>
      </Card>
    </main>
  );
}
