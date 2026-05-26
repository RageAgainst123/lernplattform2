import { describe, expect, it } from 'vitest';
import type { Block } from '@/lib/schemas/blocks';
import { evaluateBlock, isGraded, maxScore, scoreModule } from '@/lib/blocks/evaluate';

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
