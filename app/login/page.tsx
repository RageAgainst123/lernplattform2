import type { Metadata } from 'next';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/teacher/LoginForm';
import { TeacherMicrosoftButton } from '@/components/teacher/TeacherMicrosoftButton';

export const metadata: Metadata = {
  title: 'Anmelden — Lernplattform',
};

// Phase O5: zwei Login-Pfade nebeneinander.
//   - Bevorzugt: Mit Microsoft anmelden (Schul-O365 — funktioniert mit
//     'openid profile email' multi-tenant ohne Schul-IT-Admin-Consent)
//   - Fallback: Magic-Link (für private E-Mail oder Lehrer:innen ohne O365)
//
// SearchParam ?error= zeigt Fehler aus dem Auth-Callback an (sowohl Magic-
// Link als auch OAuth verwenden /auth/confirm).

const ERROR_MESSAGES: Record<string, string> = {
  link_ungueltig: 'Der Anmelde-Link ist ungültig oder abgelaufen. Bitte einen neuen anfordern.',
  profil_fehler: 'Beim Anmelden ist ein Problem aufgetreten. Bitte erneut versuchen.',
  oauth_no_code: 'Microsoft-Anmeldung wurde abgebrochen. Bitte erneut versuchen.',
  oauth_fehler: 'Microsoft-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Anmeldung für Lehrkräfte</CardTitle>
          <CardDescription>Empfohlen: mit dem Schul-Microsoft-Konto.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMsg && (
            <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
              {errorMsg}
            </p>
          )}
          <TeacherMicrosoftButton />
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="bg-border h-px flex-1" />
            <span>oder mit privater E-Mail</span>
            <div className="bg-border h-px flex-1" />
          </div>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
