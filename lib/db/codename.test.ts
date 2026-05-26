import { describe, expect, it } from 'vitest';
import { buildCodename, buildCodenames, classSlug, nextCodeNumber } from '@/lib/db/codename';

describe('classSlug', () => {
  it('takes the first token, uppercased, alphanumeric only', () => {
    expect(classSlug('5A 2026/27')).toBe('5A');
    expect(classSlug('  3b ')).toBe('3B');
    expect(classSlug('Klasse-1a')).toBe('KLASSE1A');
  });

  it('falls back to KL for empty/symbol-only names', () => {
    expect(classSlug('')).toBe('KL');
    expect(classSlug('///')).toBe('KL');
  });
});

describe('buildCodename', () => {
  it('pads numbers below 100 to two digits', () => {
    expect(buildCodename('5A', 1)).toBe('5A-01');
    expect(buildCodename('5A', 9)).toBe('5A-09');
    expect(buildCodename('5A', 25)).toBe('5A-25');
    expect(buildCodename('5A', 100)).toBe('5A-100');
  });
});

describe('buildCodenames', () => {
  it('produces a consecutive range from the start index', () => {
    expect(buildCodenames('5A', 1, 3)).toEqual(['5A-01', '5A-02', '5A-03']);
    expect(buildCodenames('5A', 4, 2)).toEqual(['5A-04', '5A-05']);
  });

  it('returns an empty array for count 0', () => {
    expect(buildCodenames('5A', 1, 0)).toEqual([]);
  });
});

describe('nextCodeNumber', () => {
  it('returns 1 for an empty list', () => {
    expect(nextCodeNumber([])).toBe(1);
  });

  it('returns max + 1 from existing codenames', () => {
    expect(nextCodeNumber(['5A-01', '5A-02', '5A-03'])).toBe(4);
    expect(nextCodeNumber(['5A-09', '5A-12', '5A-07'])).toBe(13);
  });

  it('ignores malformed entries', () => {
    expect(nextCodeNumber(['5A-01', 'broken', '5A-xx'])).toBe(2);
  });
});
