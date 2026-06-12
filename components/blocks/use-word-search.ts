'use client';

import { useMemo, useState } from 'react';
import type { WordSearchBlock } from '@/lib/schemas/blocks';
import {
  buildWordSearchGrid,
  cellKey,
  fillerLetter,
  findWordBySelection,
  wordCells,
} from '@/lib/blocks/word-search-grid';

// Auswahl-State fürs Wortsuchrätsel. Tap-basiert (touch-freundlich, kein
// Drag): erster Tap setzt den Anker, zweiter Tap das Wort-Ende. Liegt auf der
// Linie ein (noch nicht gefundenes) Wort → onFound(wordId). Gleiche Zelle
// nochmal antippen = Anker lösen. Die Buchstaben sind DETERMINISTISCH:
// Lösungszellen aus den Wörtern, Rest via fillerLetter(block.id, r, c) —
// kein Math.random, daher hydration-sicher und über Reloads stabil.

type Cell = { r: number; c: number };
type Words = WordSearchBlock['words'];

// wordId → Zell-Keys des Worts (für Found-/Missed-Hervorhebung).
export function buildCellsByWord(words: Words): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const w of words) {
    map.set(
      w.id,
      wordCells(w).map((cl) => cellKey(cl.r, cl.c))
    );
  }
  return map;
}

function collectCells(ids: string[], cellsByWord: Map<string, string[]>): Set<string> {
  const set = new Set<string>();
  for (const id of ids) for (const key of cellsByWord.get(id) ?? []) set.add(key);
  return set;
}

export function useWordSearch({
  block,
  found,
  locked,
  onFound,
}: {
  block: WordSearchBlock;
  found: string[];
  locked: boolean;
  onFound: (wordId: string) => void;
}) {
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const letters = useMemo(
    () => buildWordSearchGrid(block.rows, block.cols, block.words).cells,
    [block.rows, block.cols, block.words]
  );
  const cellsByWord = useMemo(() => buildCellsByWord(block.words), [block.words]);
  const foundCells = useMemo(() => collectCells(found, cellsByWord), [found, cellsByWord]);

  function letterAt(r: number, c: number): string {
    return letters.get(cellKey(r, c)) ?? fillerLetter(block.id, r, c);
  }

  function tap(r: number, c: number) {
    if (locked) return;
    if (anchor && anchor.r === r && anchor.c === c) {
      setAnchor(null);
      return;
    }
    if (!anchor) {
      setAnchor({ r, c });
      return;
    }
    const wordId = findWordBySelection(block.words, anchor, { r, c });
    setAnchor(null);
    if (wordId && !found.includes(wordId)) onFound(wordId);
  }

  return { anchor, letterAt, foundCells, cellsByWord, tap };
}
