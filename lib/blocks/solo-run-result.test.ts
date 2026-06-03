import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadSoloRunResult,
  stashSoloRunResult,
  clearSoloRunResult,
  type SoloRunResult,
} from '@/lib/blocks/solo-run-result';

// SessionStorage-Bridge zwischen ModuleRunner und Quiz-Endseite (R1.3).
// Solo-Punkte werden NICHT in der DB persistiert — sie leben für die Dauer
// des Browser-Tabs und füllen die Endseite. Beim Tab-Schließen weg.

// jsdom hat sessionStorage built-in — wir resetten zwischen Tests.

const moduleId = 'eva-prinzip';
const sample: SoloRunResult = {
  totalPoints: 2350,
  longestStreak: 4,
  pointsByBlock: {
    b1: { blockId: 'b1', correct: true, elapsedMs: 5000, streakAfter: 1, points: 917 },
    b2: { blockId: 'b2', correct: true, elapsedMs: 8000, streakAfter: 2, points: 867 },
    b3: { blockId: 'b3', correct: false, elapsedMs: 12000, streakAfter: 0, points: 0 },
  },
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('stash + load', () => {
  it('round-trips the result for a given module', () => {
    stashSoloRunResult(moduleId, sample);
    expect(loadSoloRunResult(moduleId)).toEqual(sample);
  });

  it('returns null when nothing was stashed', () => {
    expect(loadSoloRunResult(moduleId)).toBeNull();
  });

  it('returns null for a different module id (no cross-talk)', () => {
    stashSoloRunResult(moduleId, sample);
    expect(loadSoloRunResult('other-module')).toBeNull();
  });

  it('overwrites a previous stash for the same module', () => {
    stashSoloRunResult(moduleId, sample);
    const second: SoloRunResult = { totalPoints: 1000, longestStreak: 1, pointsByBlock: {} };
    stashSoloRunResult(moduleId, second);
    expect(loadSoloRunResult(moduleId)).toEqual(second);
  });
});

describe('clearSoloRunResult', () => {
  it('removes a stashed result', () => {
    stashSoloRunResult(moduleId, sample);
    clearSoloRunResult(moduleId);
    expect(loadSoloRunResult(moduleId)).toBeNull();
  });

  it('is a no-op when nothing was stashed', () => {
    expect(() => clearSoloRunResult(moduleId)).not.toThrow();
  });
});

describe('defensive: corrupted sessionStorage', () => {
  it('returns null when the stored value is not valid JSON', () => {
    sessionStorage.setItem(`solo-run-result:${moduleId}`, '{ not json');
    expect(loadSoloRunResult(moduleId)).toBeNull();
  });

  it('returns null when the stored value is missing required fields', () => {
    sessionStorage.setItem(`solo-run-result:${moduleId}`, JSON.stringify({ totalPoints: 100 }));
    expect(loadSoloRunResult(moduleId)).toBeNull();
  });
});
