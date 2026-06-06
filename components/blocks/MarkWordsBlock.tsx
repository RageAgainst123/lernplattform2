'use client';

import { useMemo } from 'react';
import type { MarkWordsBlock as MarkWordsBlockType } from '@/lib/schemas/blocks';
import { tokenize } from '@/lib/blocks/tokenize';
import { cn } from '@/lib/utils';

// Markieren-im-Text: der Text wird in Wort-Tokens zerlegt; jedes Wort ist
// antippbar. Markierte Wörter werden hervorgehoben. answer = number[] der
// markierten wordIndex. checked = grün/rot-Bewertung, readOnly = gesperrt.

type Props = {
  block: MarkWordsBlockType;
  answer: number[];
  checked: boolean;
  readOnly?: boolean;
  onMark: (next: number[]) => void;
};

// Farbgebung eines Wortes je nach Markier-/Bewertungs-Status.
function wordClass(opts: {
  marked: boolean;
  checked: boolean;
  isCorrectTarget: boolean;
  locked: boolean;
}): string {
  const { marked, checked, isCorrectTarget, locked } = opts;
  if (checked) {
    if (marked && isCorrectTarget) return 'bg-green-100 text-green-800 ring-1 ring-green-500';
    if (marked && !isCorrectTarget)
      return 'bg-red-100 text-red-800 ring-1 ring-red-500 line-through';
    // nicht markiert, aber hätte markiert werden müssen → gelb unterstreichen
    if (!marked && isCorrectTarget)
      return 'bg-amber-100 text-amber-800 underline decoration-dotted';
    return '';
  }
  if (marked) return 'bg-primary text-primary-foreground';
  return locked ? '' : 'hover:bg-muted cursor-pointer';
}

export function MarkWordsBlock({ block, answer, checked, readOnly = false, onMark }: Props) {
  const tokens = useMemo(() => tokenize(block.text), [block.text]);
  const markedSet = useMemo(() => new Set(answer), [answer]);
  const correctSet = useMemo(() => new Set(block.correctIndices), [block.correctIndices]);
  const locked = checked || readOnly;

  function toggle(wordIndex: number) {
    if (locked) return;
    const next = new Set(markedSet);
    if (next.has(wordIndex)) next.delete(wordIndex);
    else next.add(wordIndex);
    onMark([...next].sort((a, b) => a - b));
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.instruction}</p>
      <p className="text-lg leading-relaxed">
        {tokens.map((tok, i) => {
          if (!tok.isWord || tok.wordIndex === null) {
            return <span key={i}>{tok.text}</span>;
          }
          const wi = tok.wordIndex;
          const marked = markedSet.has(wi);
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              aria-pressed={marked}
              onClick={() => toggle(wi)}
              className={cn(
                'rounded px-0.5 transition-colors',
                wordClass({ marked, checked, isCorrectTarget: correctSet.has(wi), locked })
              )}
            >
              {tok.text}
            </button>
          );
        })}
      </p>
    </div>
  );
}
