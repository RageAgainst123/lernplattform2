'use client';

import type { ScrambleBlock as ScrambleBlockType } from '@/lib/schemas/blocks';
import { ScrambleWordField } from '@/components/blocks/scramble-word-field';

// Buchstabensalat: pro Wort werden die Buchstaben gemischt angezeigt, die
// Schüler:in tippt sie in der richtigen Reihenfolge an. Mehrere Wörter pro
// Block möglich. answer: Record<wordId, gebautes Wort>. Teilpunkte =
// richtige Wörter / alle Wörter (lib/blocks/scramble.ts → evaluate.ts).

type Props = {
  block: ScrambleBlockType;
  answer: Record<string, string>;
  checked: boolean;
  readOnly?: boolean;
  onAnswer: (next: Record<string, string>) => void;
};

export function ScrambleBlock({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const locked = checked || readOnly;
  const solved = block.words.filter(
    (w) => (answer[w.id] ?? '').toUpperCase() === w.word.toUpperCase()
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      <div className="space-y-3">
        {block.words.map((word) => (
          <ScrambleWordField
            key={word.id}
            blockId={block.id}
            word={word}
            built={answer[word.id] ?? ''}
            locked={locked}
            checked={checked}
            onChange={(next) => onAnswer({ ...answer, [word.id]: next })}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        {solved} von {block.words.length} Wörtern richtig zusammengesetzt
      </p>
    </div>
  );
}
