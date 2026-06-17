import { describe, expect, it } from 'vitest';
import {
  blockSchema,
  moduleContentSchema,
  multipleChoiceBlockSchema,
  trueFalseBlockSchema,
} from '@/lib/schemas/blocks';

describe('blockSchema', () => {
  it('accepts a valid text block', () => {
    const result = blockSchema.safeParse({ id: 'b1', type: 'text', content: 'Hallo' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown block type', () => {
    const result = blockSchema.safeParse({ id: 'b1', type: 'nope', content: 'x' });
    expect(result.success).toBe(false);
  });

  it('requires at least two options for multiple_choice', () => {
    const result = multipleChoiceBlockSchema.safeParse({
      id: 'b2',
      type: 'multiple_choice',
      question: 'Eingabegerät?',
      options: [{ id: 'o1', text: 'Tastatur', correct: true }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid true_false block', () => {
    const result = trueFalseBlockSchema.safeParse({
      id: 'b3',
      type: 'true_false',
      question: 'Ein Drucker ist ein Eingabegerät.',
      answer: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('blockSchema — neue Live-Block-Typen (Phase C)', () => {
  it('accepts quiz_poll with correct-Flag pro Option', () => {
    const result = blockSchema.safeParse({
      id: 'q1',
      type: 'quiz_poll',
      question: 'Welches ist ein Eingabegerät?',
      options: [
        { id: 'a', text: 'Maus', correct: true },
        { id: 'b', text: 'Drucker', correct: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts word_cloud (nur Frage, keine Optionen)', () => {
    const result = blockSchema.safeParse({
      id: 'w1',
      type: 'word_cloud',
      question: 'Was fällt euch ein?',
    });
    expect(result.success).toBe(true);
  });

  it('accepts scale mit min/max + Labels', () => {
    const result = blockSchema.safeParse({
      id: 's1',
      type: 'scale',
      question: 'Wie gut kennst du dich aus?',
      min: 1,
      max: 5,
      minLabel: 'gar nicht',
      maxLabel: 'sehr gut',
    });
    expect(result.success).toBe(true);
  });

  it('accepts scale ohne min/max (Defaults greifen)', () => {
    const result = blockSchema.safeParse({
      id: 's2',
      type: 'scale',
      question: 'Wie viel hast du verstanden?',
    });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === 'scale') {
      expect(result.data.min).toBe(1);
      expect(result.data.max).toBe(5);
    }
  });

  it('accepts understanding ohne Frage', () => {
    const result = blockSchema.safeParse({ id: 'u1', type: 'understanding' });
    expect(result.success).toBe(true);
  });

  it('accepts understanding mit optionaler Frage', () => {
    const result = blockSchema.safeParse({
      id: 'u2',
      type: 'understanding',
      question: 'Alles klar?',
    });
    expect(result.success).toBe(true);
  });
});

describe('moduleContentSchema', () => {
  it('accepts an empty block list', () => {
    expect(moduleContentSchema.safeParse({ blocks: [] }).success).toBe(true);
  });

  it('accepts a mixed block list', () => {
    const result = moduleContentSchema.safeParse({
      blocks: [
        { id: 'b1', type: 'text', content: 'Intro' },
        { id: 'b2', type: 'reflection', prompt: 'Was hast du gelernt?' },
      ],
    });
    expect(result.success).toBe(true);
  });
});
