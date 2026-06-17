'use client';

import { useState } from 'react';
import { submitTextVote } from '@/lib/db/live-vote-actions';
import { Button } from '@/components/ui/button';

// Overlay für word_cloud — Freitext-Eingabe (max 40 Zeichen).
// Nach Absenden: Danke-Meldung. Re-Senden überschreibt per upsert.

function InputForm({
  text,
  setText,
  pending,
  onSend,
}: {
  text: string;
  setText: (s: string) => void;
  pending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <input
        type="text"
        maxLength={40}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        placeholder="Dein Wort oder Satz…"
        className="bg-background text-foreground rounded-md border px-4 py-3 text-lg focus:outline-none"
        aria-label="Dein Beitrag"
        disabled={pending}
      />
      <Button onClick={onSend} disabled={pending || !text.trim()} className="h-12">
        Absenden
      </Button>
    </div>
  );
}

export function WordCloudOverlay({
  blockId,
  question,
  locked,
}: {
  blockId: string;
  question: string;
  locked: boolean;
}) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setPending(true);
    const res = await submitTextVote(blockId, text);
    setPending(false);
    if (!res.error) setSent(true);
  }

  return (
    <div
      className="bg-foreground/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
      role="dialog"
      aria-live="polite"
    >
      <p className="text-background max-w-2xl text-2xl font-semibold">{question}</p>
      {sent ? (
        <p className="text-background/80 text-lg">✓ Danke für deinen Beitrag!</p>
      ) : locked ? (
        <p className="text-background/60 text-base">Eingabe geschlossen.</p>
      ) : (
        <InputForm text={text} setText={setText} pending={pending} onSend={() => void send()} />
      )}
    </div>
  );
}
