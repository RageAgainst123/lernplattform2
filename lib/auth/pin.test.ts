import { describe, expect, it } from 'vitest';
import { generatePin, hashPin, verifyPin } from '@/lib/auth/pin';

describe('generatePin', () => {
  it('returns a four-digit string (leading zeros allowed)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generatePin()).toMatch(/^\d{4}$/);
    }
  });

  it('produces varied values', () => {
    const pins = new Set(Array.from({ length: 30 }, () => generatePin()));
    // Bei 30 Ziehungen aus 10000 sind Kollisionen extrem unwahrscheinlich.
    expect(pins.size).toBeGreaterThan(1);
  });
});

describe('hashPin / verifyPin', () => {
  it('hash differs from the plaintext PIN', async () => {
    const hash = await hashPin('1234');
    expect(hash).not.toBe('1234');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifyPin returns true for the correct PIN', async () => {
    const hash = await hashPin('4242');
    expect(await verifyPin('4242', hash)).toBe(true);
  });

  it('verifyPin returns false for a wrong PIN', async () => {
    const hash = await hashPin('4242');
    expect(await verifyPin('0000', hash)).toBe(false);
  });

  it('two hashes of the same PIN differ (salted)', async () => {
    const a = await hashPin('1111');
    const b = await hashPin('1111');
    expect(a).not.toBe(b);
    expect(await verifyPin('1111', a)).toBe(true);
    expect(await verifyPin('1111', b)).toBe(true);
  });
});
