import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SSO_PENDING_COOKIE, verifySsoPendingSession } from '@/lib/auth/sso-pending-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SsoJoinForm } from '@/components/student/SsoJoinForm';

export const metadata: Metadata = {
  title: 'Klasse beitreten',
};

// Phase O3: nach erfolgreicher O365-Anmeldung landet ein Schüler:in hier,
// wenn er/sie noch keiner Klasse in der App beigetreten ist. Der sso_pending-
// Cookie trägt die O365-Identität (oid + Name + Email), wir zeigen eine
// freundliche Begrüßung und fordern den Klassen-Code an.
//
// Ohne pending-Cookie: redirect zurück zu /k (vermutlich abgelaufen oder
// direkter Aufruf ohne vorherige Microsoft-Anmeldung).

export const dynamic = 'force-dynamic';

export default async function SsoJoinPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SSO_PENDING_COOKIE)?.value;
  if (!token) {
    redirect('/k');
  }
  const pending = await verifySsoPendingSession(token);
  if (!pending) {
    redirect('/k');
  }

  const fullName = [pending.givenName, pending.surname].filter(Boolean).join(' ');

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Hallo {fullName || 'Schüler:in'}!</CardTitle>
          <CardDescription className="text-base">
            Du bist mit Microsoft angemeldet ({pending.email}). Gib jetzt den Klassen-Code ein, den
            deine Lehrer:in am Beamer zeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SsoJoinForm />
        </CardContent>
      </Card>
    </div>
  );
}
