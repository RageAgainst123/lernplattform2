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
