'use client';

import { useState } from 'react';
import { submitPollVote } from '@/lib/db/live-vote-actions';
import { Button } from '@/components/ui/button';

// Overlay für understanding — 3 Ampel-Buttons (grün/gelb/rot).
// Stimme als option_id 'green'/'yellow'/'red' in live_votes.

const CHOICES = [
  { id: 'green', label: 'Verstanden', emoji: '🟢' },
  { id: 'yellow', label: 'Unsicher', emoji: '🟡' },
  { id: 'red', label: 'Noch nicht', emoji: '🔴' },
] as const;

function AmpelButtons({ pending, onVote }: { pending: boolean; onVote: (id: string) => void }) {
  return (
    <div className="flex gap-4">
      {CHOICES.map((c) => (
        <Button
          key={c.id}
          onClick={() => onVote(c.id)}
          disabled={pending}
          variant="outline"
          className="flex h-24 w-28 flex-col gap-2 text-lg"
        >
          <span className="text-3xl">{c.emoji}</span>
          <span className="text-sm">{c.label}</span>
        </Button>
      ))}
    </div>
  );
}

export function UnderstandingOverlay({
  blockId,
  question,
  locked,
}: {
  blockId: string;
  question?: string;
  locked: boolean;
}) {
  const [voted, setVoted] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function vote(id: string) {
    setPending(true);
    const res = await submitPollVote(blockId, id);
    setPending(false);
    if (!res.error) setVoted(id);
  }

  return (
    <div
      className="bg-foreground/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 p-6 text-center"
      role="dialog"
      aria-live="polite"
    >
      <p className="text-background max-w-2xl text-2xl font-semibold">
        {question ?? 'Wie gut hast du das verstanden?'}
      </p>
      {voted ? (
        <p className="text-background/80 text-lg">✓ Danke für dein Signal!</p>
      ) : locked ? (
        <p className="text-background/60 text-base">Abstimmung geschlossen.</p>
      ) : (
        <AmpelButtons pending={pending} onVote={(id) => void vote(id)} />
      )}
    </div>
  );
}
