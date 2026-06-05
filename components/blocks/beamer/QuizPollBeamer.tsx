'use client';

import { useEffect, useState } from 'react';
import type { QuizPollBlock } from '@/lib/schemas/blocks';
import { getQuizCorrectOptionsAction } from '@/lib/db/live-results-action';
import { lockAndReveal, revealResults, setBlockLocked } from '@/lib/db/live-session-actions';
import { useLiveResults } from '@/components/blocks/beamer/useLiveResults';
import { Button } from '@/components/ui/button';

// Beamer-Darstellung eines Quiz-Polls. Wie LivePollBeamer + „Auflösen"-Button
// der nach Reveal die richtigen Antworten grün markiert.
// correct-Flags kommen NICHT aus /api/live, sondern aus getQuizCorrectOptionsAction
// (Lehrer-Action, serverseitig — einmalig nach Reveal, kein Polling).
// Stimmen-Polling über /api/live/results (API-Route, kein Dev-"Rendering...").
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Lädt die richtigen Antwort-IDs einmalig nach Reveal. Eigener Hook, weil
// das nur ein Mal pro Reveal-Übergang nötig ist (nicht im Poll-Loop).
//
// 2026-06-05: ids werden nach dem Fetch nur GESETZT, nie zurückgesetzt —
// in Kombination mit dem sticky-revealed in useLiveResults wird der
// „grün → blau"-Flash beim Auflösen vermieden, auch wenn ein zwischen-
// liegender Poll-Tick mal eine inkonsistente Server-Antwort liefert.
function useCorrectIds(classId: string, blockId: string, revealed: boolean): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!revealed || ids.length > 0) return;
    let cancelled = false;
    void (async () => {
      const result = await getQuizCorrectOptionsAction(classId, blockId);
      if (!cancelled && Array.isArray(result) && result.length > 0) {
        setIds(result);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, blockId, revealed, ids.length]);
  return ids;
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
          className={`${highlight} absolute inset-y-0 left-0 transition-[width] duration-500`}
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
  const run = (fn: () => Promise<unknown>) => {
    setPending(true);
    void fn().finally(() => setPending(false));
  };
  return locked ? (
    <QuizLocked classId={classId} pending={pending} run={run} />
  ) : (
    <QuizOpen classId={classId} pending={pending} run={run} />
  );
}

type QuizSubProps = {
  classId: string;
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
};

// Quiz: gleicher Workflow wie LivePollBeamer, Label „Auflösen“ statt „Ergebnis
// zeigen“ — bei Quiz erwartet die Klasse die richtige Antwort, nicht ein Diagramm.
function QuizOpen({ classId, pending, run }: QuizSubProps) {
  return (
    <div className="flex gap-3">
      <Button
        onClick={() => void run(() => lockAndReveal(classId))}
        disabled={pending}
        className="h-10"
      >
        Abschließen &amp; Auflösen
      </Button>
      <Button
        variant="outline"
        onClick={() => void run(() => setBlockLocked(classId, true))}
        disabled={pending}
        className="h-10"
      >
        Nur schließen
      </Button>
    </div>
  );
}

function QuizLocked({ classId, pending, run }: QuizSubProps) {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => void run(() => setBlockLocked(classId, false))}
        disabled={pending}
        className="h-10"
      >
        Abstimmung öffnen
      </Button>
      <Button
        onClick={() => void run(() => revealResults(classId))}
        disabled={pending}
        className="h-10"
      >
        Auflösen
      </Button>
    </div>
  );
}

export function QuizPollBeamer({ block, classId }: { block: QuizPollBlock; classId: string }) {
  const { counts, revealed, locked, present, voters } = useLiveResults(classId, block.id);
  const correctIds = useCorrectIds(classId, block.id, revealed);
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
      {!revealed && (
        <p className="text-muted-foreground text-center text-sm">
          Antworten sind verborgen — klicke „Abschließen &amp; Auflösen“ wenn alle abgestimmt haben.
        </p>
      )}
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>🟢 {present} verbunden</span>
        <span>·</span>
        <span>{voters} abgestimmt</span>
      </div>
      <QuizControls classId={classId} locked={locked} revealed={revealed} />
    </div>
  );
}
