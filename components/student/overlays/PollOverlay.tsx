'use client';

import { useState } from 'react';
import { submitPollVote } from '@/lib/db/live-vote-actions';
import { Button } from '@/components/ui/button';

// Overlay für live_poll und quiz_poll — Optionen-Buttons + Lock-Respekt.
// Wird von LiveOverlay mit key={blockId} gemountet → State-Reset bei neuer Folie.

type Option = { id: string; text: string };

export function PollOverlay({
  blockId,
  question,
  options,
  locked,
}: {
  blockId: string;
  question: string;
  options: Option[];
  locked: boolean;
}) {
  const [voted, setVoted] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function vote(optionId: string) {
    setPending(true);
    const res = await submitPollVote(blockId, optionId);
    setPending(false);
    if (!res.error) setVoted(optionId);
  }

  return (
    <div
      className="bg-foreground/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
      role="dialog"
      aria-live="polite"
    >
      <p className="text-background max-w-2xl text-2xl font-semibold">{question}</p>
      {voted ? (
        <p className="text-background/80 text-lg">✓ Danke, deine Stimme zählt!</p>
      ) : locked ? (
        <p className="text-background/60 text-base">Abstimmung geschlossen.</p>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-3">
          {options.map((opt) => (
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
