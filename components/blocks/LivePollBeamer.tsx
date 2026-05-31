'use client';

import { useEffect, useState } from 'react';
import type { LivePollBlock as LivePollBlockType } from '@/lib/schemas/blocks';
import { getLiveResults, type AggregateResult } from '@/lib/db/live-results-action';
import { revealResults, setBlockLocked } from '@/lib/db/live-session-actions';
import { Button } from '@/components/ui/button';

// Beamer-Darstellung einer Live-Abstimmung. Zeigt drei Phasen:
//   1. Offene Abstimmung: Balken verborgen, Teilnehmerzähler sichtbar.
//      „Abstimmung schließen"-Button stoppt neue Stimmen (Kind: deaktiviert).
//   2. Geschlossene Abstimmung: Balken noch verborgen. „Ergebnis zeigen"-Button.
//   3. Ergebnis sichtbar: Balken sichtbar, Abstimmung endgültig geschlossen.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const POLL_MS = 1000;

type ResultState = Omit<AggregateResult & { error?: never }, 'error'> & {
  counts: Record<string, number>;
  revealed: boolean;
  locked: boolean;
  present: number;
  voters: number;
};

function useLiveResultsPoll(classId: string, blockId: string): ResultState {
  const [state, setState] = useState<ResultState>({
    counts: {},
    revealed: false,
    locked: false,
    present: 0,
    voters: 0,
  });
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await getLiveResults(classId, blockId);
      if (!cancelled && 'counts' in res) {
        setState({
          counts: res.counts,
          revealed: res.revealed,
          locked: res.locked,
          present: res.present,
          voters: res.voters,
        });
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

function PollBar({
  letter,
  text,
  n,
  max,
  revealed,
}: {
  letter: string;
  text: string;
  n: number;
  max: number;
  revealed: boolean;
}) {
  return (
    <li className="bg-muted relative overflow-hidden rounded-lg">
      {revealed && (
        <div
          className="bg-primary/20 absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${(n / max) * 100}%` }}
          aria-hidden
        />
      )}
      <div className="relative flex items-center gap-4 px-6 py-4 text-2xl">
        <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md font-bold">
          {letter}
        </span>
        <span className="flex-1">{text}</span>
        {revealed && <span className="text-muted-foreground tabular-nums">{n}</span>}
      </div>
    </li>
  );
}

function BeamerControls({
  classId,
  locked,
  revealed,
}: {
  classId: string;
  locked: boolean;
  revealed: boolean;
}) {
  const [pending, setPending] = useState(false);
  if (revealed) return null;

  async function toggleLock() {
    setPending(true);
    await setBlockLocked(classId, !locked);
    setPending(false);
  }

  async function reveal() {
    setPending(true);
    await revealResults(classId);
    setPending(false);
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={toggleLock} disabled={pending} className="h-10">
        {locked ? 'Abstimmung öffnen' : 'Abstimmung schließen'}
      </Button>
      {locked && (
        <Button onClick={reveal} disabled={pending} className="h-10">
          Ergebnis zeigen
        </Button>
      )}
    </div>
  );
}

export function LivePollBeamer({ block, classId }: { block: LivePollBlockType; classId: string }) {
  const { counts, revealed, locked, present, voters } = useLiveResultsPoll(classId, block.id);
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
            revealed={revealed}
          />
        ))}
      </ul>
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
      </div>
      <BeamerControls classId={classId} locked={locked} revealed={revealed} />
    </div>
  );
}
