'use client';

import { useState } from 'react';
import { submitPollVote } from '@/lib/db/live-vote-actions';
import { Button } from '@/components/ui/button';

// Overlay für scale — N große Buttons (1–N) mit optionalen Labels.
// Stimme wird als option_id '1'–'N' gespeichert.

function ScaleButtons({
  steps,
  pending,
  onVote,
  minLabel,
  maxLabel,
}: {
  steps: number[];
  pending: boolean;
  onVote: (v: number) => void;
  minLabel?: string;
  maxLabel?: string;
}) {
  return (
    <>
      <div className="flex gap-3">
        {steps.map((v) => (
          <Button
            key={v}
            onClick={() => onVote(v)}
            disabled={pending}
            className="size-16 text-2xl font-bold"
            variant="outline"
          >
            {v}
          </Button>
        ))}
      </div>
      {(minLabel ?? maxLabel) && (
        <div className="text-background/60 flex w-full max-w-xs justify-between text-sm">
          <span>{minLabel ?? ''}</span>
          <span>{maxLabel ?? ''}</span>
        </div>
      )}
    </>
  );
}

type ScaleProps = {
  blockId: string;
  question: string;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  locked: boolean;
};

export function ScaleOverlay({
  blockId,
  question,
  min,
  max,
  minLabel,
  maxLabel,
  locked,
}: ScaleProps) {
  const [voted, setVoted] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  async function vote(value: number) {
    setPending(true);
    const res = await submitPollVote(blockId, String(value));
    setPending(false);
    if (!res.error) setVoted(value);
  }

  return (
    <div
      className="bg-foreground/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
      role="dialog"
      aria-live="polite"
    >
      <p className="text-background max-w-2xl text-2xl font-semibold">{question}</p>
      {voted !== null ? (
        <p className="text-background/80 text-lg">✓ Danke! Du hast {voted} gewählt.</p>
      ) : locked ? (
        <p className="text-background/60 text-base">Abstimmung geschlossen.</p>
      ) : (
        <ScaleButtons
          steps={steps}
          pending={pending}
          onVote={(v) => void vote(v)}
          minLabel={minLabel}
          maxLabel={maxLabel}
        />
      )}
    </div>
  );
}
