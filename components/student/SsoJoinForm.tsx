'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { joinSsoClass, type JoinSsoState } from '@/lib/db/student-sso-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Phase O3: Klassen-Code-Form für SSO-Schüler:innen, nachdem sie via
// Microsoft 365 angemeldet sind aber noch keiner Klasse beigetreten sind.
// Spiegelt das Pattern von StudentLoginForm — useActionState, SubmitButton
// mit useFormStatus, generische Fehlermeldung.

const initialState: JoinSsoState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 w-full text-lg">
      {pending ? 'Tritt bei …' : 'Klasse beitreten'}
    </Button>
  );
}

export function SsoJoinForm() {
  const [state, formAction] = useActionState(joinSsoClass, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-lg">
        <label htmlFor="join-code">Klassen-Code (vom Beamer)</label>
        <Input
          id="join-code"
          name="code"
          required
          autoCapitalize="characters"
          placeholder="z. B. K7M2X9"
          className="h-12 text-center text-xl tracking-widest uppercase"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
