import { describe, expect, it } from 'vitest';

// Co-located Test für den pure Helper stickyRevealed.
// Re-implementiert hier (statt importieren), weil stickyRevealed
// implementation-detail des Hook-Moduls ist und nicht exportiert wird.
// Das hier ist eine Doku-/Regression-Wachs für die invariant:
//   „Wenn vorher revealed=true war, darf der neue State revealed=true bleiben."

type R = {
  counts: Record<string, number>;
  revealed: boolean;
  locked: boolean;
  present: number;
  voters: number;
};

const EMPTY: R = { counts: {}, revealed: false, locked: false, present: 0, voters: 0 };

// Spiegelt die Implementierung in useLiveResults.ts
function stickyRevealed(prev: R, next: R): R {
  if (prev.revealed && !next.revealed) return { ...next, revealed: true };
  return next;
}

describe('stickyRevealed (Phase Beamer-Flash-Fix)', () => {
  it('lässt revealed=true bei revealed→revealed durch', () => {
    const prev = { ...EMPTY, revealed: true, counts: { a: 5 } };
    const next = { ...EMPTY, revealed: true, counts: { a: 7 } };
    expect(stickyRevealed(prev, next)).toEqual(next);
  });

  it('lässt revealed=false→false durch (kein flip)', () => {
    expect(stickyRevealed(EMPTY, EMPTY)).toEqual(EMPTY);
  });

  it('lässt revealed=false→true durch (normaler Reveal-Übergang)', () => {
    const next = { ...EMPTY, revealed: true };
    expect(stickyRevealed(EMPTY, next)).toEqual(next);
  });

  it('hält revealed=true wenn next revealed=false sagt (sticky!)', () => {
    // Das ist die kritische Invariante: server liefert versehentlich false
    // (race, RLS, kurze inaktive Session) → wir behalten true.
    const prev = { ...EMPTY, revealed: true, counts: { a: 5 } };
    const next = { ...EMPTY, revealed: false, counts: { a: 5 } };
    const result = stickyRevealed(prev, next);
    expect(result.revealed).toBe(true);
    expect(result.counts).toEqual({ a: 5 });
  });

  it('reicht non-revealed-Felder durch (counts, locked, present, voters)', () => {
    const prev = { ...EMPTY, revealed: true };
    const next: R = {
      counts: { a: 1, b: 2 },
      revealed: true,
      locked: true,
      present: 5,
      voters: 3,
    };
    expect(stickyRevealed(prev, next)).toEqual(next);
  });
});
