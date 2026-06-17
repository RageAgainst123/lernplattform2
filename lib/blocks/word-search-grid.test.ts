import { describe, expect, it } from 'vitest';
import {
  buildWordSearchGrid,
  cellKey,
  fillerLetter,
  findWordBySelection,
  selectionPath,
  wordCells,
  type WordSearchWordLike,
} from './word-search-grid';

const WORDS: WordSearchWordLike[] = [
  { id: 'w1', word: 'MAUS', direction: 'across', row: 0, col: 0 },
  { id: 'w2', word: 'MONITOR', direction: 'down', row: 0, col: 0 },
  { id: 'w3', word: 'TABLET', direction: 'diag', row: 1, col: 1 },
];

describe('wordCells', () => {
  it('liefert Zellen in Schreibrichtung (across/down/diag)', () => {
    expect(wordCells(WORDS[0]!).map((c) => cellKey(c.r, c.c))).toEqual([
      '0,0',
      '0,1',
      '0,2',
      '0,3',
    ]);
    expect(wordCells(WORDS[2]!)[5]).toEqual({ r: 6, c: 6, letter: 'T' });
  });
});

describe('buildWordSearchGrid', () => {
  it('teilt Kreuzungs-Zellen mit gleichem Buchstaben konfliktfrei (M bei 0,0)', () => {
    const { cells, issues } = buildWordSearchGrid(8, 8, WORDS);
    expect(issues).toEqual([]);
    expect(cells.get('0,0')).toBe('M');
    expect(cells.get('3,3')).toBe('B'); // TABLET diagonal
  });

  it('meldet outOfGrid und Konflikte', () => {
    const { issues } = buildWordSearchGrid(8, 8, [
      ...WORDS,
      { id: 'w4', word: 'LANGESWORT', direction: 'across', row: 7, col: 3 },
      { id: 'w5', word: 'XX', direction: 'across', row: 0, col: 0 }, // X ≠ M
    ]);
    expect(issues.some((i) => i.type === 'outOfGrid' && i.wordId === 'w4')).toBe(true);
    expect(issues.some((i) => i.type === 'conflict' && i.wordId === 'w5')).toBe(true);
  });
});

describe('fillerLetter', () => {
  it('ist deterministisch pro (seed, r, c)', () => {
    expect(fillerLetter('block-1', 2, 3)).toBe(fillerLetter('block-1', 2, 3));
    expect(fillerLetter('block-1', 2, 3)).toMatch(/^[A-Z]$/);
  });

  it('variiert über Zellen und Seeds', () => {
    const letters = new Set<string>();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) letters.add(fillerLetter('s', r, c));
    expect(letters.size).toBeGreaterThan(3);
  });
});

describe('selectionPath + findWordBySelection', () => {
  it('findet ein Wort vorwärts und rückwärts', () => {
    expect(findWordBySelection(WORDS, { r: 0, c: 0 }, { r: 0, c: 3 })).toBe('w1');
    expect(findWordBySelection(WORDS, { r: 0, c: 3 }, { r: 0, c: 0 })).toBe('w1');
    expect(findWordBySelection(WORDS, { r: 1, c: 1 }, { r: 6, c: 6 })).toBe('w3');
  });

  it('liefert null bei schiefer Linie oder Teil-Auswahl', () => {
    expect(selectionPath({ r: 0, c: 0 }, { r: 1, c: 2 })).toBeNull();
    expect(findWordBySelection(WORDS, { r: 0, c: 0 }, { r: 1, c: 2 })).toBeNull();
    // Nur 3 von 4 MAUS-Zellen → kein Treffer
    expect(findWordBySelection(WORDS, { r: 0, c: 0 }, { r: 0, c: 2 })).toBeNull();
  });
});
