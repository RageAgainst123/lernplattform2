import { describe, expect, it } from 'vitest';
import { isFuzzyMatch, levenshtein } from '@/lib/blocks/levenshtein';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('mathe', 'mathe')).toBe(0);
    expect(levenshtein('', '')).toBe(0);
  });

  it('counts single-character substitutions', () => {
    expect(levenshtein('mathe', 'matze')).toBe(1);
    expect(levenshtein('haus', 'maus')).toBe(1);
  });

  it('counts single-character insertions', () => {
    expect(levenshtein('mathe', 'mathik')).toBe(2);
    expect(levenshtein('ja', 'jaa')).toBe(1);
  });

  it('counts single-character deletions', () => {
    expect(levenshtein('mathematik', 'mathematic')).toBe(1);
    expect(levenshtein('mathe', 'math')).toBe(1);
  });

  it('handles empty vs non-empty', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('handles transposition as 2 edits (kein Damerau)', () => {
    // Plain Levenshtein ohne Damerau-Erweiterung: ab → ba sind 2 Edits.
    expect(levenshtein('ab', 'ba')).toBe(2);
  });
});

describe('isFuzzyMatch — Tippfehlertoleranz für Lückentext', () => {
  it('matches exact strings (case + whitespace normalized)', () => {
    expect(isFuzzyMatch('Mathematik', 'mathematik')).toBe(true);
    expect(isFuzzyMatch('  mathe  ', 'mathe')).toBe(true);
    expect(isFuzzyMatch('MATHE', 'mathe')).toBe(true);
  });

  it('accepts single-char typo for words ≥ 4 chars', () => {
    // „mathematic" statt „mathematik" — 1 Edit, 10 chars → ok
    expect(isFuzzyMatch('mathematic', 'mathematik')).toBe(true);
    // „haus" vs „maus" — 1 Edit, 4 chars → ok
    expect(isFuzzyMatch('maus', 'haus')).toBe(true);
  });

  it('rejects single-char typo for short words (< 4 chars)', () => {
    // „ja" vs „jo" — 1 Edit, aber 2 chars → zu kurz für Toleranz
    expect(isFuzzyMatch('jo', 'ja')).toBe(false);
    // „ich" vs „ach" — 1 Edit, 3 chars → zu kurz für Toleranz
    expect(isFuzzyMatch('ach', 'ich')).toBe(false);
  });

  it('rejects 2+ typos even on long words', () => {
    // „mathematik" vs „matehmatic" — 2 Edits → nein
    expect(isFuzzyMatch('matehmatic', 'mathematik')).toBe(false);
    // Komplett falsches Wort → nein
    expect(isFuzzyMatch('biologie', 'mathematik')).toBe(false);
  });

  it('accepts exact match even for short words', () => {
    expect(isFuzzyMatch('ja', 'ja')).toBe(true);
    expect(isFuzzyMatch('ach', 'ach')).toBe(true);
  });

  it('treats null/undefined/empty input as non-match', () => {
    expect(isFuzzyMatch('', 'mathe')).toBe(false);
    expect(isFuzzyMatch('mathe', '')).toBe(false);
  });

  it('uses the LONGER string for length threshold (defensive)', () => {
    // input „mat" (3) vs solution „mathe" (5) — 2 Edits, max len 5 → ≥4 ja,
    // aber 2 > 1 → trotzdem nein. Lengthcheck schaut nur ob Toleranz
    // überhaupt anwendbar ist, nicht ob sie reicht.
    expect(isFuzzyMatch('mat', 'mathe')).toBe(false);
  });
});
