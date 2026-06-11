'use client';

import type { MemoryBlock as MemoryBlockType } from '@/lib/schemas/blocks';
import { MemoryCard } from '@/components/blocks/memory-cards';
import { useMemoryGame } from '@/components/blocks/use-memory-game';

// Memory / Paare-Spiel: Schüler:in deckt zwei Karten auf; bilden sie ein Paar,
// bleiben sie offen, sonst klappen sie zurück. Tap-basiert, kein Drag.
//
// answer: string[] der gematchten pairIds. checked/readOnly = gesperrt → alle
// Karten offen, grün (gematcht) / neutral (nicht gefunden). Teilpunkte =
// gefundene Paare / Anzahl Paare (siehe lib/blocks/evaluate.ts).

type Props = {
  block: MemoryBlockType;
  answer: string[]; // gematchte pairIds
  checked: boolean;
  readOnly?: boolean;
  onAnswer: (next: string[]) => void;
};

export function MemoryBlock({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const locked = checked || readOnly;
  const { cards, flipped, matchedSet, flip } = useMemoryGame({
    block,
    matched: answer,
    locked,
    onMatch: (pairId) => {
      if (!answer.includes(pairId)) onAnswer([...answer, pairId]);
    },
  });
  const foundCount = block.pairs.filter((p) => matchedSet.has(p.id)).length;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((card) => (
          <MemoryCard
            key={card.key}
            card={card}
            faceUp={flipped.includes(card.key)}
            matched={matchedSet.has(card.pairId)}
            locked={locked}
            onFlip={flip}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        {foundCount} von {block.pairs.length} Paaren gefunden
      </p>
    </div>
  );
}
