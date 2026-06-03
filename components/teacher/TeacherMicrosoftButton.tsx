'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// Phase O5: Microsoft-365-Login-Button für Lehrer:innen.
// Startet den OAuth-Flow über Supabase → Microsoft Entra ID → Callback
// /auth/confirm (mit ?code= statt ?token_hash=). Identische UX-Strategie
// wie beim Schüler:innen-Button (components/student/MicrosoftLoginButton.tsx).
//
// Wichtig: gleicher Azure-App-Registration wie für Schüler:innen — die
// Scopes 'openid profile email' sind Multi-Tenant-tauglich ohne
// Schul-IT-Admin-Consent.

export function TeacherMicrosoftButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid profile email',
        redirectTo,
      },
    });
    if (authError) {
      setError('Microsoft-Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
      setPending(false);
    }
    // Bei Erfolg: Browser navigiert zu Microsoft → kein lokales State-Update nötig
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="h-12 w-full bg-[#2F2F2F] text-base text-white hover:bg-[#444]"
      >
        <span aria-hidden className="mr-2 inline-block h-4 w-4">
          {/* Microsoft 4-Quadrate-Logo */}
          <svg viewBox="0 0 21 21" className="h-full w-full">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
        </span>
        {pending ? 'Anmelden …' : 'Mit Microsoft anmelden'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
