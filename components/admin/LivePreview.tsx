'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import {
  blockResult,
  blockScore,
  isGraded,
  type BlockAnswer,
  type BlockResult,
} from '@/lib/blocks/evaluate';
import { BlockView } from '@/components/blocks/BlockView';
import { HintBox } from '@/components/blocks/HintBox';
import { Button } from '@/components/ui/button';

// Live-Vorschau für den Modul-Editor. Rendert einen Block aus dem aktuellen
// Stand, mit „Nächster/Vorheriger"-Navigation. Reuse BlockView (gleiche
// Komponente wie für Schüler:innen). Mit „Prüfen"-Knopf kann die Autorin den
// Block komplett durchspielen inkl. Bewertungsanzeige (grün/rot/gelb +
// Teilpunkte) — ohne Test-Login. Funktioniert generisch für ALLE bewertbaren
// Block-Typen (rein über isGraded/blockResult/blockScore).

// Hinweis-Text + Farbe pro Bewertungs-Ergebnis.
function resultBadge(result: BlockResult, score: number | null): { text: string; cls: string } {
  const pct = score === null ? null : Math.round(score * 100);
  if (result === 'correct') {
    return { text: '✓ Richtig (100 %)', cls: 'border-green-300 bg-green-50 text-green-800' };
  }
  if (result === 'partial') {
    return {
      text: `Teilweise richtig${pct === null ? '' : ` (${pct} %)`}`,
      cls: 'border-amber-300 bg-amber-50 text-amber-900',
    };
  }
  return { text: '✗ Falsch (0 %)', cls: 'border-red-300 bg-red-50 text-red-800' };
}

// Bewertungs-Leiste unter dem Block: Prüfen-Knopf bzw. Ergebnis + Zurücksetzen.
function GradingBar({
  block,
  answer,
  checked,
  onCheck,
  onReset,
}: {
  block: Block;
  answer: BlockAnswer | undefined;
  checked: boolean;
  onCheck: () => void;
  onReset: () => void;
}) {
  if (!isGraded(block)) return null;
  if (!checked) {
    return (
      <Button size="sm" onClick={onCheck}>
        Prüfen
      </Button>
    );
  }
  const result = blockResult(block, answer);
  const score = blockScore(block, answer);
  const badge = resultBadge(result, score);
  const hint = 'hint' in block ? block.hint : undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md border px-2 py-1 text-sm font-medium ${badge.cls}`}>
          {badge.text}
        </span>
        <Button size="sm" variant="outline" onClick={onReset}>
          Zurücksetzen
        </Button>
      </div>
      {result !== 'correct' && hint && <HintBox hint={hint} />}
    </div>
  );
}

export function LivePreview({ blocks }: { blocks: Block[] }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<BlockAnswer | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const safeIndex = Math.min(index, Math.max(0, blocks.length - 1));
  const block = blocks[safeIndex];

  function reset() {
    setAnswer(undefined);
    setChecked(false);
  }

  function go(delta: number) {
    setIndex((i) => Math.min(blocks.length - 1, Math.max(0, i + delta)));
    reset();
  }

  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Vorschau erscheint, sobald Blöcke vorhanden sind.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          Block {safeIndex + 1} / {blocks.length}
        </span>
        <span className="font-mono">{block.type}</span>
      </div>
      <div className="rounded-lg border p-4">
        <BlockView block={block} answer={answer} checked={checked} onAnswer={(a) => setAnswer(a)} />
        <div className="mt-4">
          <GradingBar
            block={block}
            answer={answer}
            checked={checked}
            onCheck={() => setChecked(true)}
            onReset={reset}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <Button size="sm" variant="outline" onClick={() => go(-1)} disabled={safeIndex === 0}>
          ← Zurück
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => go(1)}
          disabled={safeIndex === blocks.length - 1}
        >
          Weiter →
        </Button>
      </div>
    </div>
  );
}
