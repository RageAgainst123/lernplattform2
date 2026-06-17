'use client';

import { useState, useTransition } from 'react';
import { leaveClass } from '@/lib/db/student-leave-action';
import { Button } from '@/components/ui/button';

// Phase O3+: Schüler:in kann selbst Klasse verlassen.
// Zwei-Schritt-Bestätigung damit nicht versehentlich geklickt wird.
// Nach Erfolg redirected die Server Action zu /k — diese Komponente sieht
// keinen Erfolgs-Zustand mehr.

export function LeaveClassButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="hover:text-destructive text-xs underline"
      >
        Diese Klasse verlassen
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-sm">
        Wirklich aus dieser Klasse austreten? Dein Lern-Fortschritt geht dabei verloren.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => leaveClass())}
        >
          {pending ? 'Verlasse …' : 'Ja, verlassen'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
