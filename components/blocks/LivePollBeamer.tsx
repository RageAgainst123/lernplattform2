'use client';

import { useState } from 'react';
import type { LivePollBlock as LivePollBlockType } from '@/lib/schemas/blocks';
import { setBlockLocked } from '@/lib/db/live-session-actions';
import { useLiveResults } from '@/components/blocks/beamer/useLiveResults';
import { Button } from '@/components/ui/button';

// Beamer-Darstellung einer Live-Abstimmung (Meinungsbild — keine richtige
// Antwort). 2026-06-05: semantische Korrektur — Balken sind IMMER sichtbar
// und wachsen mit jeder Stimme. Das ist der ganze Reiz eines Live-Polls.
// Das frühere Reveal-Konzept („Ergebnis zeigen") gehört NUR zu Quiz-Poll
// (wo die Lehrer:in die richtige Antwort auflösen will). Hier kann
// Lehrer:in optional die Abstimmung schließen, falls sie nach einer Weile
// keine weiteren Stimmen mehr will — oder einfach zur nächsten Folie gehen.
//
// Polling über /api/live/results (API-Route, nicht Server Action) → kein
// Dev-Mode-„Rendering…"-Overlay und kein Server-Action-Wrapper-Overhead.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
        className="bg-primary/20 absolute inset-y-0 left-0 transition-[width] duration-500"
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

// Eine einzige Kontrolle: Abstimmung sperren oder wieder öffnen. Kein Reveal-
// Workflow — Balken sind ohnehin schon sichtbar.
function LockControl({ classId, locked }: { classId: string; locked: boolean }) {
  const [pending, setPending] = useState(false);
  const toggle = () => {
    setPending(true);
    void setBlockLocked(classId, !locked).finally(() => setPending(false));
  };
  return (
    <Button onClick={toggle} variant="outline" disabled={pending} className="h-10">
      {locked ? 'Abstimmung wieder öffnen' : 'Abstimmung schließen'}
    </Button>
  );
}

export function LivePollBeamer({ block, classId }: { block: LivePollBlockType; classId: string }) {
  const { counts, locked, present, voters } = useLiveResults(classId, block.id);
  // Balken-Breite proportional zur Max-Stimme. Wenn noch keine Stimmen da
  // sind, ist max=1 (Math.max-Defensive) → alle Balken sind 0% breit, was
  // korrekt aussieht (leere Balken-Slots).
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
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
        {locked && (
          <>
            <span>·</span>
            <span className="text-amber-700">🔒 geschlossen</span>
          </>
        )}
      </div>
      <LockControl classId={classId} locked={locked} />
    </div>
  );
}
