import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { normalizeJoinCode } from '@/lib/db/join-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MicrosoftLoginButton } from '@/components/student/MicrosoftLoginButton';

export const metadata: Metadata = {
  title: 'Anmelden',
};

async function goToClass(formData: FormData) {
  'use server';
  const code = normalizeJoinCode(String(formData.get('code') ?? ''));
  if (code) {
    redirect(`/k/${code}`);
  }
}

// Phase O3: zwei Login-Pfade nebeneinander.
//   - Empfohlen: Mit Microsoft anmelden (für Schulen mit O365 = NÖ alle)
//   - Fallback: Klassencode + PIN (Volksschule ohne O365, Vertretung,
//     vergessenes Passwort)
//
// SearchParam ?error= zeigt Fehler aus dem OAuth-Callback an (z.B. nach
// abgebrochener Microsoft-Anmeldung oder DB-Fehler).

const ERROR_MESSAGES: Record<string, string> = {
  oauth_no_code: 'Anmeldung wurde abgebrochen. Bitte erneut versuchen.',
  oauth_fehler: 'Microsoft-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
  oauth_keine_id: 'Dein Microsoft-Konto hat keine E-Mail. Bitte Schul-IT fragen.',
  db_fehler: 'Es gab ein Datenbank-Problem. Bitte später erneut versuchen.',
};

function PinCodeForm() {
  return (
    <form action={goToClass} className="flex flex-col gap-3">
      <label htmlFor="code" className="text-sm font-medium">
        Klassencode (für Anmeldung mit PIN)
      </label>
      <Input
        id="code"
        name="code"
        required
        autoCapitalize="characters"
        placeholder="z. B. K7M2X9"
        className="h-12 text-center text-xl tracking-widest uppercase"
      />
      <Button type="submit" variant="outline" className="h-12 w-full">
        Weiter
      </Button>
    </form>
  );
}

export default async function JoinCodePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription className="text-base">
            Empfohlen: mit deinem Schul-Microsoft-Konto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMsg && (
            <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
              {errorMsg}
            </p>
          )}
          <MicrosoftLoginButton />
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="bg-border h-px flex-1" />
            <span>oder</span>
            <div className="bg-border h-px flex-1" />
          </div>
          <PinCodeForm />
        </CardContent>
      </Card>
    </div>
  );
}
