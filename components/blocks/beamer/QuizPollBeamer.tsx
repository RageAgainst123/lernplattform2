'use client';

import { useEffect, useState } from 'react';
import type { QuizPollBlock } from '@/lib/schemas/blocks';
import { getLiveResults, getQuizCorrectOptionsAction } from '@/lib/db/live-results-action';
import { revealResults, setBlockLocked } from '@/lib/db/live-session-actions';
import { Button } from '@/components/ui/button';

// Beamer-Darstellung eines Quiz-Polls. Wie LivePollBeamer + „Auflösen"-Button
// der nach Reveal die richtigen Antworten grün markiert.
// correct-Flags kommen NICHT aus /api/live, sondern aus getQuizCorrectOptionsAction
// (Lehrer-Action, serverseitig) — kein Leak an Schüler:innen-Geräte.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const POLL_MS = 1000;

type ResultState = {
  counts: Record<string, number>;
  revealed: boolean;
  locked: boolean;
  present: number;
  voters: number;
};

function useQuizPoll(classId: string, blockId: string) {
  const [result, setResult] = useState<ResultState>({
    counts: {},
    revealed: false,
    locked: false,
    present: 0,
    voters: 0,
  });
  const [correctIds, setCorrectIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await getLiveResults(classId, blockId);
      if (!cancelled && 'counts' in res) {
        setResult({
          counts: res.counts,
          revealed: res.revealed,
          locked: res.locked,
          present: res.present,
          voters: res.voters,
        });
        if (res.revealed && correctIds.length === 0) {
          const ids = await getQuizCorrectOptionsAction(classId, blockId);
          if (!cancelled && Array.isArray(ids)) setCorrectIds(ids);
        }
      }
    }
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, blockId, correctIds.length]);

  return { ...result, correctIds };
}

function QuizBar({
  letter,
  text,
  n,
  max,
  revealed,
  correct,
}: {
  letter: string;
  text: string;
  n: number;
  max: number;
  revealed: boolean;
  correct: boolean;
}) {
  const highlight = revealed && correct ? 'bg-green-500/30' : 'bg-primary/20';
  return (
    <li className="bg-muted relative overflow-hidden rounded-lg">
      {revealed && (
        <div
          className={`${highlight} absolute inset-y-0 left-0 transition-all duration-500`}
          style={{ width: `${(n / max) * 100}%` }}
          aria-hidden
        />
      )}
      <div className="relative flex items-center gap-4 px-6 py-4 text-2xl">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-md font-bold ${revealed && correct ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}
        >
          {letter}
        </span>
        <span className="flex-1">{text}</span>
        {revealed && <span className="text-muted-foreground tabular-nums">{n}</span>}
      </div>
    </li>
  );
}

function QuizControls({
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
          Auflösen
        </Button>
      )}
    </div>
  );
}

export function QuizPollBeamer({ block, classId }: { block: QuizPollBlock; classId: string }) {
  const { counts, revealed, locked, present, voters, correctIds } = useQuizPoll(classId, block.id);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question}
      </h2>
      <ul className="flex w-full flex-col gap-3">
        {block.options.map((opt, i) => (
          <QuizBar
            key={opt.id}
            letter={LETTERS[i] ?? String(i + 1)}
            text={opt.text}
            n={counts[opt.id] ?? 0}
            max={max}
            revealed={revealed}
            correct={correctIds.includes(opt.id)}
          />
        ))}
      </ul>
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
      </div>
      <QuizControls classId={classId} locked={locked} revealed={revealed} />
    </div>
  );
}
