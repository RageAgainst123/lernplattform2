import { describe, expect, it } from 'vitest';
import {
  classInsertSchema,
  moduleInsertSchema,
  pinSchema,
  schulstufeSchema,
} from '@/lib/schemas/entities';

describe('schulstufeSchema', () => {
  it.each([1, 5, 9])('accepts valid Schulstufe %i', (n) => {
    expect(schulstufeSchema.safeParse(n).success).toBe(true);
  });

  it.each([0, 10, 5.5])('rejects invalid Schulstufe %s', (n) => {
    expect(schulstufeSchema.safeParse(n).success).toBe(false);
  });
});

describe('pinSchema', () => {
  it('accepts a four-digit PIN', () => {
    expect(pinSchema.safeParse('1234').success).toBe(true);
  });

  it.each(['123', '12345', 'abcd', ''])('rejects invalid PIN %s', (pin) => {
    expect(pinSchema.safeParse(pin).success).toBe(false);
  });
});

describe('classInsertSchema', () => {
  it('accepts a valid class', () => {
    expect(classInsertSchema.safeParse({ name: '5A 2026/27', schulstufe: 5 }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(classInsertSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('moduleInsertSchema', () => {
  it('defaults isPublished to false and requires content', () => {
    const result = moduleInsertSchema.safeParse({
      title: 'EVA-Prinzip',
      content: { blocks: [] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it('rejects a missing title', () => {
    expect(moduleInsertSchema.safeParse({ content: { blocks: [] } }).success).toBe(false);
  });
});
