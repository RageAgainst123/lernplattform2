import { describe, expect, it } from 'vitest';
import {
  buildCrosswordGrid,
  cellKey,
  crosswordSolutionCells,
  gradeCrosswordCells,
  wordCells,
  type CrosswordWordLike,
} from './crossword-grid';

// Gitter-Ableitung fürs Kreuzworträtsel: Zellen aus Wörtern, Kreuzungen,
// Konflikte, Fit-Check + zell-basiertes Grading. MAUS (across) und MONITOR
// (down) starten beide bei (0,0) und teilen das M — die Standard-Fixture.

const MAUS: CrosswordWordLike = { id: 'w1', answer: 'MAUS', direction: 'across', row: 0, col: 0 };
const MONITOR: CrosswordWordLike = {
  id: 'w2',
  answer: 'MONITOR',
  direction: 'down',
  row: 0,
  col: 0,
};

describe('wordCells', () => {
  it('across läuft nach rechts, down nach unten', () => {
    expect(wordCells(MAUS)).toEqual([
      { r: 0, c: 0, letter: 'M' },
      { r: 0, c: 1, letter: 'A' },
      { r: 0, c: 2, letter: 'U' },
      { r: 0, c: 3, letter: 'S' },
    ]);
    expect(wordCells(MONITOR)[1]).toEqual({ r: 1, c: 0, letter: 'O' });
  });
});

describe('buildCrosswordGrid', () => {
  it('geteilte Kreuzungszelle zählt nur einmal (4+7−1 Zellen)', () => {
    const { cells, issues } = buildCrosswordGrid(7, 5, [MAUS, MONITOR]);
    expect(issues).toEqual([]);
    expect(cells.size).toBe(10);
    expect(cells.get(cellKey(0, 0))).toBe('M');
  });

  it('meldet outOfGrid, wenn ein Wort nicht passt', () => {
    // MONITOR (7 Buchstaben, down) passt nicht in 5 Zeilen.
    const { issues } = buildCrosswordGrid(5, 5, [MONITOR]);
    expect(issues).toEqual([{ type: 'outOfGrid', wordId: 'w2' }]);
  });

  it('meldet Kreuzungs-Konflikt bei unterschiedlichen Buchstaben', () => {
    // SOS (down, Start (0,1)) kreuzt MAUS bei (0,1): A ≠ S.
    const sos: CrosswordWordLike = { id: 'w3', answer: 'SOS', direction: 'down', row: 0, col: 1 };
    const { issues } = buildCrosswordGrid(7, 5, [MAUS, sos]);
    expect(issues).toEqual([
      { type: 'conflict', wordId: 'w3', r: 0, c: 1, existing: 'A', incoming: 'S' },
    ]);
  });
});

describe('gradeCrosswordCells', () => {
  const block = { rows: 7, cols: 5, words: [MAUS, MONITOR] }; // 10 Zellen

  it('alle Zellen richtig → 1', () => {
    const answer = Object.fromEntries(crosswordSolutionCells(block));
    expect(gradeCrosswordCells(block, answer)).toBe(1);
  });

  it('halb gefüllt → anteilig (5 von 10 = 0.5)', () => {
    const entries = [...crosswordSolutionCells(block)].slice(0, 5);
    expect(gradeCrosswordCells(block, Object.fromEntries(entries))).toBe(0.5);
  });

  it('leere Antwort → 0', () => {
    expect(gradeCrosswordCells(block, {})).toBe(0);
  });

  it('Kleinbuchstaben zählen (case-insensitiv)', () => {
    expect(gradeCrosswordCells(block, { '0,0': 'm' })).toBe(0.1);
  });

  it('falscher Buchstabe zählt nicht', () => {
    expect(gradeCrosswordCells(block, { '0,0': 'X' })).toBe(0);
  });
});
