import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/teacher-auth';
import { signOut } from '@/lib/auth/actions';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard — Lernplattform',
};

export default async function LehrerDashboard() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
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
          Verwalten Sie hier Ihre Klassen. Module und Auswertungen folgen.
        </CardContent>
        <CardFooter>
          <Link href="/lehrer/klassen" className={buttonVariants()}>
            Zu den Klassen
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
