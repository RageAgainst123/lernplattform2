'use client';

import { useMemo } from 'react';
import type { FillBlankBlock as FillBlankType } from '@/lib/schemas/blocks';
import { parseFillText } from '@/lib/blocks/fill-blank';
import { cn } from '@/lib/utils';
import { FillBlankText } from '@/components/blocks/FillBlankText';
import { useShuffled } from '@/components/blocks/useShuffled';

type Props = {
  block: FillBlankType;
  filled: (string | null)[]; // Wort pro Lücke (null = leer)
  checked: boolean;
  readOnly?: boolean;
  onFill: (next: (string | null)[]) => void;
};

export function FillBlankBlock({ block, filled, checked, readOnly = false, onFill }: Props) {
  const segments = useMemo(() => parseFillText(block.text), [block.text]);
  // Pool stable referenzieren (useMemo), damit useShuffled nur einmal pro
  // Block-Wechsel neu mischt und nicht bei jedem Re-Render.
  const baseItems = useMemo(
    () => [...block.solutions, ...block.distractors],
    [block.solutions, block.distractors]
  );
  const pool = useShuffled(baseItems);
  const used = new Set(filled.filter(Boolean));
  const locked = checked || readOnly;

  function placeWord(word: string) {
    const slot = filled.findIndex((f) => f === null);
    if (slot === -1) return;
    const next = [...filled];
    next[slot] = word;
    onFill(next);
  }

  function clearSlot(index: number) {
    const next = [...filled];
    next[index] = null;
    onFill(next);
  }

  return (
    <div className="space-y-4">
      <FillBlankText
        segments={segments}
        filled={filled}
        solutions={block.solutions}
        checked={checked}
        readOnly={readOnly}
        onClear={clearSlot}
      />
      <div className="flex flex-wrap gap-2">
        {pool.map((word, i) => (
          <button
            key={`${word}-${i}`}
            type="button"
            disabled={locked || used.has(word)}
            onClick={() => placeWord(word)}
            className={cn('rounded-md border px-3 py-2 text-lg', used.has(word) && 'opacity-30')}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
