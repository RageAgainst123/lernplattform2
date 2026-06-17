'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MemoryBlock } from '@/lib/schemas/blocks';
import { useShuffled } from '@/components/blocks/useShuffled';
import type { MemoryCardView } from '@/components/blocks/memory-cards';

// Flip-State-Machine für das Memory-Spiel. Tap-basiert (kein Drag):
//   - 0 offen → erste Karte aufdecken.
//   - 1 offen → zweite Karte aufdecken; gleiches Paar → bleibt offen +
//     onMatch(pairId), sonst beide ~700 ms zeigen, dann zudecken.
//   - während 2 nicht-passende offen sind, ist Input gesperrt.
// Die Antwort (gematchte pairIds) lebt im Eltern-State; der Hook meldet jeden
// neuen Treffer via onMatch. Der Flip-Back-Timer liegt hier, damit die
// Renderer-Komponente deklarativ bleibt (testbar mit Fake-Timers).

const FLIP_BACK_MS = 700;

export function useMemoryGame({
  block,
  matched,
  locked,
  onMatch,
}: {
  block: MemoryBlock;
  matched: string[];
  locked: boolean;
  onMatch: (pairId: string) => void;
}) {
  // Flache Karten-Liste (2 pro Paar) — stabil referenziert (useMemo), damit
  // useShuffled nur einmal pro Block-Wechsel mischt. Ohne useMemo entsteht bei
  // jedem Render ein neues Array → der Effect in useShuffled feuert endlos
  // (Re-Render-Loop, hängende Tests). Gleiches Muster wie FillBlankBlock.
  const flatCards: MemoryCardView[] = useMemo(
    () =>
      block.pairs.flatMap((p) => [
        { key: `${p.id}:a`, pairId: p.id, content: p.a },
        { key: `${p.id}:b`, pairId: p.id, content: p.b },
      ]),
    [block.pairs]
  );
  const cards = useShuffled(flatCards);

  const [flipped, setFlipped] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchedSet = new Set(matched);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function flip(key: string) {
    if (locked || flipped.length >= 2 || flipped.includes(key)) return;
    const next = [...flipped, key];
    setFlipped(next);
    if (next.length < 2) return;
    const [a, b] = next;
    const pairIdA = cards.find((c) => c.key === a)?.pairId;
    const pairIdB = cards.find((c) => c.key === b)?.pairId;
    if (pairIdA !== undefined && pairIdA === pairIdB) {
      onMatch(pairIdA);
      setFlipped([]);
    } else {
      timer.current = setTimeout(() => setFlipped([]), FLIP_BACK_MS);
    }
  }

  return { cards, flipped, matchedSet, flip };
}
