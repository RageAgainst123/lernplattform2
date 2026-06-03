import { describe, expect, it } from 'vitest';
import { calculatePoints, streakBonus } from '@/lib/blocks/points';

// Punkte-Formel (siehe docs/QUIZ-MODI-SPEZIFIKATION.md §8):
//   base = round(1000 × (1 - 0.5 × elapsed/timeLimit))  bei richtig
//   plus Streak-Bonus (höchster passender Tier, nicht kumulativ):
//     newStreak ≥ 7 → +500
//     newStreak ≥ 5 → +250
//     newStreak ≥ 3 → +100
//
// Alle Zahlen kommen direkt aus der Spezifikation und sind verbindlich für
// Solo (R1, optionale Anzeige) und Live/Hausaufgabe/Team (S2, DB-persistiert).

describe('streakBonus', () => {
  it('returns 0 below the first tier', () => {
    expect(streakBonus(0)).toBe(0);
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBe(0);
  });

  it('returns 100 from streak 3 to 4', () => {
    expect(streakBonus(3)).toBe(100);
    expect(streakBonus(4)).toBe(100);
  });

  it('returns 250 from streak 5 to 6', () => {
    expect(streakBonus(5)).toBe(250);
    expect(streakBonus(6)).toBe(250);
  });

  it('returns 500 from streak 7 upwards (no further tiers)', () => {
    expect(streakBonus(7)).toBe(500);
    expect(streakBonus(10)).toBe(500);
    expect(streakBonus(100)).toBe(500);
  });

  it('treats negative streaks as 0 (defensive)', () => {
    expect(streakBonus(-1)).toBe(0);
  });
});

describe('calculatePoints — falsche Antwort', () => {
  it('returns 0 regardless of speed or streak', () => {
    expect(calculatePoints(false, 0, 30, 0)).toBe(0);
    expect(calculatePoints(false, 5000, 30, 5)).toBe(0);
    expect(calculatePoints(false, 0, 30, 100)).toBe(0);
  });
});

describe('calculatePoints — richtige Antwort, Zeit-Bonus', () => {
  it('returns the max base 1000 for an instant answer', () => {
    expect(calculatePoints(true, 0, 30, 0)).toBe(1000);
  });

  it('halves to base 500 when the time limit is fully used', () => {
    // 30000ms / 30s → ratio 1.0 → 1000 × (1 - 0.5) = 500
    expect(calculatePoints(true, 30_000, 30, 0)).toBe(500);
  });

  it('clamps overlong answers to the minimum base 500 (cap)', () => {
    // Late submits dürfen nie unter 500 fallen (Math.min im Ratio).
    expect(calculatePoints(true, 60_000, 30, 0)).toBe(500);
    expect(calculatePoints(true, 999_999, 30, 0)).toBe(500);
  });

  it('matches the worked example from the spec (5s at 30s limit)', () => {
    // base = round(1000 × (1 - 0.5 × 5/30)) = round(1000 × 0.9166…) = 917
    expect(calculatePoints(true, 5000, 30, 0)).toBe(917);
  });

  it('matches the homework example (8s at 30s limit, streak 1)', () => {
    // base = round(1000 × (1 - 0.5 × 8/30)) = round(866.6…) = 867
    expect(calculatePoints(true, 8000, 30, 1)).toBe(867);
  });

  it('matches the solo example (15s at 30s limit, streak 3 = bonus 100)', () => {
    // base = round(1000 × (1 - 0.5 × 15/30)) = round(750) = 750, +100 streak = 850
    expect(calculatePoints(true, 15_000, 30, 3)).toBe(850);
  });
});

describe('calculatePoints — Streak-Bonus oben drauf', () => {
  it('adds 100 from streak 3', () => {
    // base 1000 + streak 100
    expect(calculatePoints(true, 0, 30, 3)).toBe(1100);
  });

  it('adds 250 from streak 5', () => {
    expect(calculatePoints(true, 0, 30, 5)).toBe(1250);
  });

  it('adds 500 from streak 7 — and nothing more for higher streaks', () => {
    expect(calculatePoints(true, 0, 30, 7)).toBe(1500);
    expect(calculatePoints(true, 0, 30, 100)).toBe(1500);
  });

  it('combines time decay and streak bonus (5s, streak 5 → 917 + 250 = 1167)', () => {
    expect(calculatePoints(true, 5000, 30, 5)).toBe(1167);
  });
});

describe('calculatePoints — defensive guards', () => {
  it('treats negative elapsed as 0 (clock skew defense)', () => {
    expect(calculatePoints(true, -100, 30, 0)).toBe(1000);
  });

  it('handles a custom time limit (60s)', () => {
    // 30s at 60s limit → ratio 0.5 → 1000 × (1 - 0.25) = 750
    expect(calculatePoints(true, 30_000, 60, 0)).toBe(750);
  });

  it('returns max base when time limit is 0 (degenerate, kein elapsed sinnvoll)', () => {
    // Bei timeLimit=0 ist die Formel nicht definiert — defensive: max base.
    expect(calculatePoints(true, 0, 0, 0)).toBe(1000);
    expect(calculatePoints(true, 5000, 0, 0)).toBe(1000);
  });
});
