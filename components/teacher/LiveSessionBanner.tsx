'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { endPresentation } from '@/lib/db/live-session-actions';
import { Button } from '@/components/ui/button';

// Banner auf der Klassen-Detailseite, wenn gerade eine Live-Präsentation läuft.
// „Jetzt beenden" beendet die Session via Server-Action + router.refresh() — so
// kann Geo eine vergessene Session auch von einem anderen Gerät (Handy) killen,
// ohne den Beamer-Tab zu suchen. Sichtbar nur wenn serverseitig eine lebende
// Session erkannt wurde (isPresentationLiveForTeacher).
export function LiveSessionBanner({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function end() {
    startTransition(async () => {
      await endPresentation(classId);
      router.refresh();
    });
  }

  return (
    <div className="border-destructive/40 bg-destructive/10 flex items-center justify-between gap-4 rounded-lg border p-4">
      <p className="text-sm font-medium">
        🔴 Eine Live-Präsentation läuft gerade für diese Klasse. Die Geräte der Schüler:innen sind
        verdunkelt.
      </p>
      <Button variant="destructive" onClick={end} disabled={pending} className="shrink-0">
        Jetzt beenden
      </Button>
    </div>
  );
}
