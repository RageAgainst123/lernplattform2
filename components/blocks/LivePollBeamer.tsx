'use client';

import { useEffect, useState } from 'react';
import type { LivePollBlock as LivePollBlockType } from '@/lib/schemas/blocks';
import { getLiveResults } from '@/lib/db/live-results-action';

// Beamer-Darstellung einer Live-Abstimmung MIT live wachsendem Ergebnisbalken.
// Pollt das Stimmen-Aggregat (getLiveResults) im festen Intervall; die Balken
// füllen sich relativ zur größten Option. Wird vom PresentationRunner nur
// gezeigt, wenn der aktuelle Block ein live_poll ist und eine Live-Session läuft.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
// Beamer-Ergebnisbalken: schnell pollen (1 s), damit eintreffende Stimmen für
// die Klasse gefühlt sofort wachsen. Läuft nur, solange eine Poll-Folie offen ist.
const POLL_MS = 1000;

function usePollCounts(classId: string, blockId: string): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await getLiveResults(classId, blockId);
      if (!cancelled && 'counts' in res) setCounts(res.counts);
    }
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, blockId]);
  return counts;
}

function PollBar({
  letter,
  text,
  n,
  max,
}: {
  letter: string;
  text: string;
  n: number;
  max: number;
}) {
  return (
    <li className="bg-muted relative overflow-hidden rounded-lg">
      <div
        className="bg-primary/20 absolute inset-y-0 left-0 transition-all duration-500"
        style={{ width: `${(n / max) * 100}%` }}
        aria-hidden
      />
      <div className="relative flex items-center gap-4 px-6 py-4 text-2xl">
        <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md font-bold">
          {letter}
        </span>
        <span className="flex-1">{text}</span>
        <span className="text-muted-foreground tabular-nums">{n}</span>
      </div>
    </li>
  );
}

export function LivePollBeamer({ block, classId }: { block: LivePollBlockType; classId: string }) {
  const counts = usePollCounts(classId, block.id);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question}
      </h2>
      <ul className="flex w-full flex-col gap-3">
        {block.options.map((opt, i) => (
          <PollBar
            key={opt.id}
            letter={LETTERS[i] ?? String(i + 1)}
            text={opt.text}
            n={counts[opt.id] ?? 0}
            max={max}
          />
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? 'Stimme' : 'Stimmen'}
      </p>
    </div>
  );
}
