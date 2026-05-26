import { describe, expect, it } from 'vitest';
import { generateJoinCode, normalizeJoinCode } from '@/lib/db/join-code';

describe('generateJoinCode', () => {
  it('returns a 6-character code from the safe alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateJoinCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('excludes ambiguous characters (0, O, 1, I, L)', () => {
    const codes = Array.from({ length: 100 }, () => generateJoinCode()).join('');
    expect(codes).not.toMatch(/[0O1IL]/);
  });

  it('produces varied codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateJoinCode()));
    expect(codes.size).toBeGreaterThan(40);
  });
});

describe('normalizeJoinCode', () => {
  it('uppercases and strips spaces/hyphens', () => {
    expect(normalizeJoinCode(' k7m-2x9 ')).toBe('K7M2X9');
    expect(normalizeJoinCode('k7m2x9')).toBe('K7M2X9');
  });
});
