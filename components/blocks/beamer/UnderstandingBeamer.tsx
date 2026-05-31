'use client';

import { useEffect, useState } from 'react';
import type { UnderstandingBlock } from '@/lib/schemas/blocks';
import { getLiveResults } from '@/lib/db/live-results-action';

// Beamer-Darstellung der Verständnis-Ampel. Drei feste Optionen
// grün/gelb/rot, große Balken mit Prozent + Anzahl. Pollt getLiveResults
// (option_id 'green'/'yellow'/'red'). Keine Reveal-Mechanik — Signale sind
// für Lehrer:in immer sichtbar (das ist der Sinn der Ampel).
const POLL_MS = 1000;

type AmpelState = { counts: Record<string, number>; present: number; voters: number };

const COLORS = [
  { id: 'green', label: 'Verstanden', emoji: '🟢', bar: 'bg-green-500' },
  { id: 'yellow', label: 'Unsicher', emoji: '🟡', bar: 'bg-yellow-400' },
  { id: 'red', label: 'Noch nicht', emoji: '🔴', bar: 'bg-red-500' },
] as const;

function useAmpelPoll(classId: string, blockId: string): AmpelState {
  const [state, setState] = useState<AmpelState>({ counts: {}, present: 0, voters: 0 });
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await getLiveResults(classId, blockId);
      if (!cancelled && 'counts' in res) {
        setState({ counts: res.counts, present: res.present, voters: res.voters });
      }
    }
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, blockId]);
  return state;
}

function AmpelRow({
  emoji,
  label,
  count,
  total,
  bar,
}: {
  emoji: string;
  label: string;
  count: number;
  total: number;
  bar: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <li className="bg-muted relative overflow-hidden rounded-lg">
      <div
        className={`${bar} absolute inset-y-0 left-0 opacity-30 transition-all duration-500`}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <div className="relative flex items-center gap-4 px-6 py-5 text-2xl">
        <span className="text-3xl" aria-hidden>
          {emoji}
        </span>
        <span className="flex-1 font-semibold">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} · {pct}%
        </span>
      </div>
    </li>
  );
}

export function UnderstandingBeamer({
  block,
  classId,
}: {
  block: UnderstandingBlock;
  classId: string;
}) {
  const { counts, present, voters } = useAmpelPoll(classId, block.id);
  const total = (counts.green ?? 0) + (counts.yellow ?? 0) + (counts.red ?? 0);
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question ?? 'Wie gut hast du das verstanden?'}
      </h2>
      <ul className="flex w-full flex-col gap-3">
        {COLORS.map((c) => (
          <AmpelRow
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            count={counts[c.id] ?? 0}
            total={total}
            bar={c.bar}
          />
        ))}
      </ul>
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
      </div>
    </div>
  );
}
