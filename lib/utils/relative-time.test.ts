import { describe, expect, it } from 'vitest';
import { daysSince, formatRelativeDe } from './relative-time';

const now = new Date('2026-06-12T10:00:00Z');

describe('formatRelativeDe (V7)', () => {
  it('heute / gestern / vor N Tagen', () => {
    expect(formatRelativeDe('2026-06-12T08:00:00Z', now)).toBe('heute');
    expect(formatRelativeDe('2026-06-11T09:00:00Z', now)).toBe('gestern');
    expect(formatRelativeDe('2026-06-09T10:00:00Z', now)).toBe('vor 3 Tagen');
    expect(formatRelativeDe('2026-05-01T10:00:00Z', now)).toBe('vor 42 Tagen');
  });

  it('null/undefined/ungültig → noch nie geöffnet', () => {
    expect(formatRelativeDe(null, now)).toBe('noch nie geöffnet');
    expect(formatRelativeDe(undefined, now)).toBe('noch nie geöffnet');
    expect(formatRelativeDe('kein datum', now)).toBe('noch nie geöffnet');
  });
});

describe('daysSince (V7)', () => {
  it('volle Tage, null bei fehlendem Zeitstempel', () => {
    expect(daysSince('2026-06-12T09:59:00Z', now)).toBe(0);
    expect(daysSince('2026-05-20T10:00:00Z', now)).toBe(23);
    expect(daysSince(null, now)).toBeNull();
  });
});
