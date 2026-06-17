'use client';

import { useMemo, useState } from 'react';
import type { CrosswordBlock } from '@/lib/schemas/blocks';
import {
  buildCrosswordGrid,
  cellKey,
  crosswordNumbering,
  wordCells,
} from '@/lib/blocks/crossword-grid';

// Interaktions-State fürs Kreuzworträtsel: Zelle antippen → aktiv, Buchstabe
// tippen → eintragen + weiter zur nächsten Zelle des Wortes. Bei Kreuzungs-
// zellen schaltet Re-Tap die Richtung um (across ↔ down). Tap + Tastatur,
// kein Drag. Die Gitter-Ableitung kommt aus lib/blocks/crossword-grid.ts.

export type ActiveCell = { r: number; c: number } | null;

type Word = CrosswordBlock['words'][number];
type CellWords = Map<string, { across?: Word; down?: Word }>;

// Alle Zellen-Keys des Wortes, das gerade aktiv ist (fürs Highlight im Gitter).
function activeWordKeys(active: ActiveCell, dir: 'across' | 'down', cellWords: CellWords) {
  const word = active ? cellWords.get(cellKey(active.r, active.c))?.[dir] : undefined;
  return new Set(word ? wordCells(word).map(({ r, c }) => cellKey(r, c)) : []);
}

// Pro Zelle: welches across-/down-Wort sie abdeckt (Richtungs-Wahl + Advance).
function buildCellWords(words: Word[]): CellWords {
  const m: CellWords = new Map();
  for (const w of words) {
    for (const { r, c } of wordCells(w)) {
      const entry = m.get(cellKey(r, c)) ?? {};
      entry[w.direction] = w;
      m.set(cellKey(r, c), entry);
    }
  }
  return m;
}

type UseCrosswordArgs = {
  block: CrosswordBlock;
  answer: Record<string, string>;
  onAnswer: (next: Record<string, string>) => void;
};

export function useCrossword({ block, answer, onAnswer }: UseCrosswordArgs) {
  const { cells } = useMemo(
    () => buildCrosswordGrid(block.rows, block.cols, block.words),
    [block.rows, block.cols, block.words]
  );
  const { startNumbers, wordNumbers } = useMemo(
    () => crosswordNumbering(block.words),
    [block.words]
  );
  const cellWords = useMemo(() => buildCellWords(block.words), [block.words]);

  const [active, setActive] = useState<ActiveCell>(null);
  const [dir, setDir] = useState<'across' | 'down'>('across');

  function tap(r: number, c: number) {
    const covered = cellWords.get(cellKey(r, c));
    if (!covered) return;
    if (active && active.r === r && active.c === c && covered.across && covered.down) {
      setDir(dir === 'across' ? 'down' : 'across'); // Kreuzung: Richtung togglen
      return;
    }
    setActive({ r, c });
    setDir(covered[dir] ? dir : covered.across ? 'across' : 'down');
  }

  // Buchstabe eintragen + eine Zelle entlang der Richtung weiter (solange das
  // Wort dort weitergeht).
  function input(r: number, c: number, letter: string) {
    onAnswer({ ...answer, [cellKey(r, c)]: letter.toUpperCase() });
    const next = dir === 'across' ? { r, c: c + 1 } : { r: r + 1, c };
    if (cellWords.get(cellKey(next.r, next.c))?.[dir]) setActive(next);
  }

  // Backspace: gefüllte Zelle leeren, sonst eine Zelle zurück + aktivieren.
  function backspace(r: number, c: number) {
    const key = cellKey(r, c);
    if (answer[key]) {
      const next = { ...answer };
      delete next[key];
      onAnswer(next);
      return;
    }
    const prev = dir === 'across' ? { r, c: c - 1 } : { r: r - 1, c };
    if (cellWords.get(cellKey(prev.r, prev.c))?.[dir]) setActive(prev);
  }

  const wordKeys = activeWordKeys(active, dir, cellWords);
  return { cells, startNumbers, wordNumbers, active, wordKeys, tap, input, backspace };
}
