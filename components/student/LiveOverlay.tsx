'use client';

import { useState } from 'react';
import { useLiveSync } from '@/components/student/useLiveSync';
import { submitPollVote } from '@/lib/db/live-vote-actions';
import { Button } from '@/components/ui/button';
import type { LiveState } from '@/app/api/live/route';

// Vollflächiges Overlay über dem gesamten Schüler:innen-Bereich. Während einer
// Live-Präsentation der Lehrer:in:
//   - reine Folie  → dunkles „Schau nach vorne"-Overlay (Fokus aufs Plenum)
//   - Live-Poll    → Abstimmung auf dem eigenen Gerät
// Die darunterliegende Seite (z. B. ein Modul) bleibt im Speicher erhalten —
// das Overlay legt sich nur darüber, es navigiert nicht weg.
//
// Wird im /s-Layout gerendert, greift also auf allen /s-Seiten. Bei keiner
// aktiven Session rendert es nichts (normaler Seitenbetrieb).

function DimOverlay() {
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

type Poll = Extract<LiveState, { interactive: true }>['poll'];

function PollOverlay({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function vote(optionId: string) {
    setPending(true);
    const res = await submitPollVote(poll.blockId, optionId);
    setPending(false);
    if (!res.error) setVoted(optionId);
  }

  return (
    <div
      className="bg-foreground/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
      role="dialog"
      aria-live="polite"
    >
      <p className="text-background max-w-2xl text-2xl font-semibold">{poll.question}</p>
      {voted ? (
        <p className="text-background/80 text-lg">✓ Danke, deine Stimme zählt!</p>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-3">
          {poll.options.map((opt) => (
            <Button
              key={opt.id}
              onClick={() => vote(opt.id)}
              disabled={pending}
              className="h-14 text-lg"
            >
              {opt.text}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveOverlay() {
  const state = useLiveSync();
  if (!state.active) {
    return null;
  }
  if (state.interactive) {
    // key={blockId}: bei neuer Frage wird PollOverlay frisch gemountet → der
    // lokale „abgestimmt"-Zustand setzt sich automatisch zurück (kein Effect).
    return <PollOverlay key={state.poll.blockId} poll={state.poll} />;
  }
  return <DimOverlay />;
}
