'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SquareIcon } from 'lucide-react';
import { endPresentation } from '@/lib/db/live-session-actions';
import { Button } from '@/components/ui/button';

// Roter „Präsentation beenden"-Button für die Beamer-NavBar. Beendet die aktive
// Session sofort (statt nur über Tab-Schließen/Heartbeat-Tod) und navigiert zurück
// zur Klasse. Kurze Inline-Bestätigung (kein Dialog-Paket nötig): erster Klick
// fragt, zweiter bestätigt — wegklickbar durch „Abbrechen".
export function EndPresentationButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function end() {
    startTransition(async () => {
      await endPresentation(classId);
      router.push(`/lehrer/klassen/${classId}`);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Wirklich beenden?</span>
        <Button variant="destructive" onClick={end} disabled={pending} className="h-12 px-4">
          Ja, beenden
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-12 px-4"
        >
          Abbrechen
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      onClick={() => setConfirming(true)}
      className="h-12 px-4"
      aria-label="Präsentation beenden"
    >
      <SquareIcon className="size-4" aria-hidden />
      Beenden
    </Button>
  );
}
