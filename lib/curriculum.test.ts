import { describe, expect, it } from 'vitest';
import {
  KOMPETENZBEREICHE,
  KOMPETENZBEREICH_INFO,
  isKompetenzbereich,
  isSekundarstufe,
} from '@/lib/curriculum';

describe('isKompetenzbereich', () => {
  it('accepts valid slugs', () => {
    expect(isKompetenzbereich('information')).toBe(true);
    expect(isKompetenzbereich('orientierung')).toBe(true);
  });
  it('rejects invalid slugs', () => {
    expect(isKompetenzbereich('foo')).toBe(false);
    expect(isKompetenzbereich('')).toBe(false);
  });
});

describe('isSekundarstufe', () => {
  it.each([5, 6, 7, 8])('accepts %i', (n) => {
    expect(isSekundarstufe(n)).toBe(true);
  });
  it.each([4, 9, 0])('rejects %i', (n) => {
    expect(isSekundarstufe(n)).toBe(false);
  });
});

describe('KOMPETENZBEREICH_INFO', () => {
  it('has a label + description for every Kompetenzbereich', () => {
    for (const bereich of KOMPETENZBEREICHE) {
      expect(KOMPETENZBEREICH_INFO[bereich].label).toBeTruthy();
      expect(KOMPETENZBEREICH_INFO[bereich].description).toBeTruthy();
    }
  });
});
