import { describe, expect, it } from 'vitest';
import { gradeScrambleWords, scrambledLetters, usedTileIndices } from './scramble';

describe('scrambledLetters', () => {
  it('ist deterministisch pro (wort, seed) und enthält dieselben Buchstaben', () => {
    const a = scrambledLetters('TASTATUR', 'b1:w1');
    const b = scrambledLetters('TASTATUR', 'b1:w1');
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...'TASTATUR'].sort());
  });

  it('liefert nie die Original-Reihenfolge (Rotation als Fallback)', () => {
    // Über viele Seeds prüfen — auch wenn Fisher-Yates zufällig die Identität
    // ergäbe, greift die Rotations-Absicherung.
    for (let i = 0; i < 50; i++) {
      expect(scrambledLetters('AB', `seed-${i}`).join('')).not.toBe('AB');
      expect(scrambledLetters('MAUS', `seed-${i}`).join('')).not.toBe('MAUS');
    }
  });

  it('uppercased die Eingabe', () => {
    expect(scrambledLetters('maus', 's').join('')).toMatch(/^[A-Z]+$/);
  });
});

describe('gradeScrambleWords', () => {
  const block = {
    words: [
      { id: 'w1', word: 'MAUS' },
      { id: 'w2', word: 'TASTATUR' },
    ],
  };

  it('Teilpunkte = richtige Wörter / alle', () => {
    expect(gradeScrambleWords(block, { w1: 'MAUS' })).toBe(0.5);
    expect(gradeScrambleWords(block, { w1: 'MAUS', w2: 'TASTATUR' })).toBe(1);
    expect(gradeScrambleWords(block, { w1: 'MASU' })).toBe(0);
    expect(gradeScrambleWords(block, {})).toBe(0);
  });

  it('vergleicht case-insensitiv', () => {
    expect(gradeScrambleWords(block, { w1: 'maus' })).toBe(0.5);
  });
});

describe('usedTileIndices', () => {
  it('rekonstruiert Indizes greedy, korrekt bei Doppel-Buchstaben', () => {
    const tiles = ['T', 'A', 'T', 'S']; // 2× T
    expect(usedTileIndices(tiles, 'TT')).toEqual([0, 2]);
    expect(usedTileIndices(tiles, 'AT')).toEqual([1, 0]);
  });

  it('bricht bei nicht vorhandenem Buchstaben ab', () => {
    expect(usedTileIndices(['A', 'B'], 'AX')).toEqual([0]);
  });
});
