import { describe, expect, it } from 'vitest';
import type { Block } from '@/lib/schemas/blocks';
import {
  blockResult,
  evaluateBlock,
  gradeBlock,
  isGraded,
  isPassed,
  maxScore,
  percentScore,
  scoreModule,
} from '@/lib/blocks/evaluate';

const mc: Block = {
  id: 'mc',
  type: 'multiple_choice',
  question: 'Eingabegerät?',
  options: [
    { id: 'o1', text: 'Tastatur', correct: true },
    { id: 'o2', text: 'Drucker', correct: false },
    { id: 'o3', text: 'Maus', correct: true },
  ],
};

const tf: Block = { id: 'tf', type: 'true_false', question: 'Drucker = Eingabe?', answer: false };

const fb: Block = {
  id: 'fb',
  type: 'fill_blank',
  text: 'Ein {0} ist ein Eingabegerät.',
  solutions: ['Mikrofon'],
  distractors: ['Drucker'],
};

const match: Block = {
  id: 'm',
  type: 'match',
  pairs: [
    { id: 'p1', term: 'Tastatur', category: 'Eingabe' },
    { id: 'p2', term: 'Drucker', category: 'Ausgabe' },
  ],
};

describe('isGraded', () => {
  it('marks content/reflection blocks as not graded', () => {
    expect(isGraded({ id: 't', type: 'text', content: 'x' })).toBe(false);
    expect(isGraded({ id: 'r', type: 'reflection', prompt: '?' })).toBe(false);
    expect(isGraded(mc)).toBe(true);
  });
});

describe('evaluateBlock — multiple_choice', () => {
  it('accepts exactly the correct set', () => {
    expect(evaluateBlock(mc, ['o1', 'o3'])).toBe(true);
  });
  it('rejects a missing or extra option', () => {
    expect(evaluateBlock(mc, ['o1'])).toBe(false);
    expect(evaluateBlock(mc, ['o1', 'o2', 'o3'])).toBe(false);
  });
  it('ignores duplicate selections', () => {
    expect(evaluateBlock(mc, ['o1', 'o1', 'o3'])).toBe(true);
  });
});

describe('evaluateBlock — true_false', () => {
  it('matches the boolean answer', () => {
    expect(evaluateBlock(tf, false)).toBe(true);
    expect(evaluateBlock(tf, true)).toBe(false);
  });
});

describe('evaluateBlock — fill_blank', () => {
  it('is case-insensitive and trims', () => {
    expect(evaluateBlock(fb, ['  mikrofon '])).toBe(true);
  });
  it('rejects wrong word or wrong count', () => {
    expect(evaluateBlock(fb, ['Drucker'])).toBe(false);
    expect(evaluateBlock(fb, [])).toBe(false);
  });

  // Tippfehlertoleranz (R1.5, siehe docs/QUIZ-MODI-SPEZIFIKATION.md §9).
  it('accepts a single typo on words ≥ 4 chars (Levenshtein ≤ 1)', () => {
    // „mikrofon" (8) ↔ „mikrofen" (1 substitution) → ok
    expect(evaluateBlock(fb, ['mikrofen'])).toBe(true);
    // 1 fehlender Buchstabe → ok
    expect(evaluateBlock(fb, ['mikrofn'])).toBe(true);
    // 1 extra Buchstabe → ok
    expect(evaluateBlock(fb, ['mikrofonn'])).toBe(true);
  });

  it('still rejects 2+ typos', () => {
    // „mikrofon" ↔ „mokrofin" → 2 substitutions
    expect(evaluateBlock(fb, ['mokrofin'])).toBe(false);
  });

  it('respects strict=true (no typo tolerance)', () => {
    const fbStrict: Block = {
      id: 'fb-strict',
      type: 'fill_blank',
      text: 'Die chemische Formel von Wasser ist {0}.',
      solutions: ['H2O'],
      distractors: [],
      strict: true,
    };
    // Genau richtig → ok (auch mit Trim+Lowercase)
    expect(evaluateBlock(fbStrict, ['h2o'])).toBe(true);
    // 1 Edit-Distanz, aber strict → falsch
    expect(evaluateBlock(fbStrict, ['h2p'])).toBe(false);
  });
});

describe('evaluateBlock — match', () => {
  it('requires every pair in the right category', () => {
    expect(evaluateBlock(match, { p1: 'Eingabe', p2: 'Ausgabe' })).toBe(true);
    expect(evaluateBlock(match, { p1: 'Ausgabe', p2: 'Ausgabe' })).toBe(false);
  });
});

describe('scoreModule / maxScore', () => {
  const blocks: Block[] = [{ id: 't', type: 'text', content: 'Intro' }, mc, tf, fb, match];

  it('counts only graded, correct blocks', () => {
    const answers = {
      mc: ['o1', 'o3'],
      tf: false,
      fb: ['Mikrofon'],
      m: { p1: 'Eingabe', p2: 'Ausgabe' },
    };
    expect(scoreModule(blocks, answers)).toBe(4);
    expect(maxScore(blocks)).toBe(4);
  });

  it('partial score when some are wrong', () => {
    expect(scoreModule(blocks, { mc: ['o1'], tf: false, fb: [], m: {} })).toBe(1);
  });
});

describe('gradeBlock', () => {
  it('returns 1 for a correct graded block, 0 for wrong', () => {
    expect(gradeBlock(mc, ['o1', 'o3'])).toBe(1);
    expect(gradeBlock(mc, ['o1'])).toBe(0);
  });
  it('treats an undefined answer as 0 (unanswered)', () => {
    expect(gradeBlock(tf, undefined)).toBe(0);
  });
  it('returns 0 for non-graded blocks', () => {
    expect(gradeBlock({ id: 'r', type: 'reflection', prompt: '?' }, 'irgendwas')).toBe(0);
  });
});

describe('percentScore', () => {
  it('computes rounded percent', () => {
    expect(percentScore(4, 5)).toBe(80);
    expect(percentScore(2, 3)).toBe(67);
    expect(percentScore(5, 5)).toBe(100);
    expect(percentScore(0, 5)).toBe(0);
  });
  it('returns null when there are no gradable blocks', () => {
    expect(percentScore(0, 0)).toBeNull();
  });
});

describe('isPassed', () => {
  it('passes when percent >= threshold', () => {
    expect(isPassed(4, 5, 80)).toBe(true); // 80% >= 80
    expect(isPassed(5, 5, 80)).toBe(true);
  });
  it('fails when percent < threshold', () => {
    expect(isPassed(3, 5, 80)).toBe(false); // 60% < 80
  });
  it('returns null when no threshold is set', () => {
    expect(isPassed(4, 5, null)).toBeNull();
  });
  it('returns null when there are no gradable blocks (max 0)', () => {
    expect(isPassed(0, 0, 80)).toBeNull();
  });
});

describe('blockResult', () => {
  it('returns correct/wrong for graded blocks', () => {
    expect(blockResult(mc, ['o1', 'o3'])).toBe('correct');
    expect(blockResult(mc, ['o1'])).toBe('wrong');
  });
  it('returns wrong for an unanswered graded block', () => {
    expect(blockResult(tf, undefined)).toBe('wrong');
  });
  it('returns ungraded for text/infobox/reflection', () => {
    expect(blockResult({ id: 't', type: 'text', content: 'x' }, undefined)).toBe('ungraded');
    expect(blockResult({ id: 'r', type: 'reflection', prompt: '?' }, 'text')).toBe('ungraded');
  });
});
