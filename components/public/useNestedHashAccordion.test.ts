import { describe, expect, it } from 'vitest';
import { buildNestedHash, parseNestedHash } from './useNestedHashAccordion';

// Pure-Helper-Tests für das Hash-Schema #bereich oder #bereich/thema.

describe('parseNestedHash', () => {
  it('returns nulls for empty input', () => {
    expect(parseNestedHash('')).toEqual({ bereich: null, topic: null });
    expect(parseNestedHash('#')).toEqual({ bereich: null, topic: null });
  });

  it('parses a single-segment hash as bereich-only', () => {
    expect(parseNestedHash('orientierung')).toEqual({ bereich: 'orientierung', topic: null });
    expect(parseNestedHash('#orientierung')).toEqual({ bereich: 'orientierung', topic: null });
  });

  it('parses a two-segment hash as bereich + topic', () => {
    expect(parseNestedHash('#orientierung/eva-prinzip')).toEqual({
      bereich: 'orientierung',
      topic: 'eva-prinzip',
    });
  });

  it('caps at two segments — additional slashes go into the topic part', () => {
    // Konkret: split('/', 2) hört nach dem ersten Segment auf
    expect(parseNestedHash('orientierung/extra/garbage')).toEqual({
      bereich: 'orientierung',
      topic: 'extra',
    });
  });
});

describe('buildNestedHash', () => {
  it('returns empty string when bereich is null', () => {
    expect(buildNestedHash(null)).toBe('');
    expect(buildNestedHash(null, 'eva-prinzip')).toBe('');
  });

  it('returns bereich alone when no topic is given', () => {
    expect(buildNestedHash('orientierung')).toBe('orientierung');
    expect(buildNestedHash('orientierung', null)).toBe('orientierung');
  });

  it('joins bereich and topic with a slash', () => {
    expect(buildNestedHash('orientierung', 'eva-prinzip')).toBe('orientierung/eva-prinzip');
  });
});
