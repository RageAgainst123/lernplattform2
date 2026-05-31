'use client';

import { useLiveSync } from '@/components/student/useLiveSync';

// Vollflächiges Overlay über dem gesamten Schüler:innen-Bereich. Während einer
// Live-Präsentation der Lehrer:in:
//   - reine Folie  → dunkles „Schau nach vorne"-Overlay (Fokus aufs Plenum)
//   - Live-Poll    → Abstimmung (folgt in Stufe 3)
// Die darunterliegende Seite (z. B. ein Modul) bleibt im Speicher erhalten —
// das Overlay legt sich nur darüber, es navigiert nicht weg.
//
// Wird im /s-Layout gerendert, greift also auf allen /s-Seiten. Bei keiner
// aktiven Session rendert es nichts (normaler Seitenbetrieb).
export function LiveOverlay() {
  const state = useLiveSync();

  if (!state.active) {
    return null;
  }

  // Stufe 3 ergänzt hier den interaktiven Poll-Zweig (state.interactive === true).
  return (
    <div
      className="bg-foreground/95 text-background fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-8 text-center"
      role="dialog"
      aria-live="polite"
    >
      <span className="text-6xl" aria-hidden>
        📺
      </span>
      <p className="text-2xl font-semibold">Schau nach vorne</p>
      <p className="text-background/70 text-sm">Die Lehrer:in präsentiert gerade.</p>
    </div>
  );
}
