'use client';

import type { ScaleBlock } from '@/lib/schemas/blocks';
import { useLiveResults } from '@/components/blocks/beamer/useLiveResults';

// Beamer-Darstellung einer Skala-Abstimmung. Zeigt Durchschnitt + Balken pro Wert.
// Polling über /api/live/results (API-Route, kein Server-Action-Overhead).

function average(counts: Record<string, number>): number | null {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total === 0) return null;
  const sum = Object.entries(counts).reduce((s, [k, n]) => s + Number(k) * n, 0);
  return sum / total;
}

export function ScaleBeamer({ block, classId }: { block: ScaleBlock; classId: string }) {
  const { counts, present, voters } = useLiveResults(classId, block.id);
  const steps = Array.from({ length: block.max - block.min + 1 }, (_, i) => block.min + i);
  const max = Math.max(1, ...Object.values(counts));
  const avg = average(counts);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question}
      </h2>
      {avg !== null && (
        <p className="text-primary text-5xl font-bold tabular-nums">Ø {avg.toFixed(1)}</p>
      )}
      <div className="flex w-full items-end justify-center gap-4">
        {steps.map((v) => {
          const n = counts[String(v)] ?? 0;
          const pct = (n / max) * 100;
          return (
            <div key={v} className="flex flex-col items-center gap-2">
              <span className="text-muted-foreground text-sm tabular-nums">{n}</span>
              <div
                className="bg-primary/20 w-16 rounded-t"
                style={{ height: `${Math.max(4, pct * 1.5)}px` }}
              />
              <span className="text-xl font-bold">{v}</span>
            </div>
          );
        })}
      </div>
      {(block.minLabel ?? block.maxLabel) && (
        <div className="text-muted-foreground flex w-full max-w-sm justify-between text-sm">
          <span>{block.minLabel ?? ''}</span>
          <span>{block.maxLabel ?? ''}</span>
        </div>
      )}
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
      </div>
    </div>
  );
}
