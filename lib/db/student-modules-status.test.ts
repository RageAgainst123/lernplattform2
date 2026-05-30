import { describe, expect, it } from 'vitest';
import {
  deriveStatus,
  progressStatusMap,
  sortByStatus,
  countByStatus,
} from './student-modules-status';

// Pure-Helper-Test: aus den 3 möglichen DB-Zuständen die korrekte
// Status-Map ableiten. Module ohne progress-Row tauchen NICHT in der Map
// auf — Aufrufer setzt für die den Default 'open'.

describe('progressStatusMap', () => {
  it('returns an empty map when there are no progress rows', () => {
    expect(progressStatusMap([]).size).toBe(0);
  });

  it('maps progress with completed_at = null to in_progress', () => {
    const map = progressStatusMap([{ module_id: 'm1', completed_at: null }]);
    expect(map.get('m1')).toBe('in_progress');
  });

  it('maps progress with completed_at set to done', () => {
    const map = progressStatusMap([{ module_id: 'm1', completed_at: '2026-05-29T12:00:00Z' }]);
    expect(map.get('m1')).toBe('done');
  });

  it('handles a mix of in_progress and done rows in a single map', () => {
    const map = progressStatusMap([
      { module_id: 'm1', completed_at: null },
      { module_id: 'm2', completed_at: '2026-05-29T12:00:00Z' },
      { module_id: 'm3', completed_at: null },
    ]);
    expect(map.get('m1')).toBe('in_progress');
    expect(map.get('m2')).toBe('done');
    expect(map.get('m3')).toBe('in_progress');
    expect(map.has('m4')).toBe(false);
  });

  it('treats an empty-string completed_at as falsy → in_progress (defensive)', () => {
    // Supabase liefert null wenn der Wert NULL ist; ein leerer String
    // wäre fachlich ein Fehler. progressStatusMap fällt auf JS-Wahrheit
    // zurück und klassifiziert leeren String als nicht abgeschlossen.
    const map = progressStatusMap([{ module_id: 'm1', completed_at: '' }]);
    expect(map.get('m1')).toBe('in_progress');
  });

  it('maps a returned row (returned_at set, completed_at null) to returned', () => {
    const map = progressStatusMap([
      { module_id: 'm1', completed_at: null, returned_at: '2026-05-30T08:00:00Z' },
    ]);
    expect(map.get('m1')).toBe('returned');
  });

  it('maps a re-submitted row (both timestamps set) to done', () => {
    const map = progressStatusMap([
      {
        module_id: 'm1',
        completed_at: '2026-05-30T10:00:00Z',
        returned_at: '2026-05-30T08:00:00Z',
      },
    ]);
    expect(map.get('m1')).toBe('done');
  });
});

describe('deriveStatus', () => {
  it('returned beats done when only returned_at is set', () => {
    expect(deriveStatus({ module_id: 'm', completed_at: null, returned_at: 'x' })).toBe('returned');
  });
  it('done when completed_at is set and no pending return', () => {
    expect(deriveStatus({ module_id: 'm', completed_at: 'x' })).toBe('done');
  });
  it('in_progress when a row exists but nothing is completed/returned', () => {
    expect(deriveStatus({ module_id: 'm', completed_at: null })).toBe('in_progress');
  });
});

describe('sortByStatus', () => {
  it('orders items as returned, in_progress, open, then done', () => {
    const input = [
      { id: 'a', status: 'done' as const },
      { id: 'b', status: 'open' as const },
      { id: 'c', status: 'in_progress' as const },
      { id: 'd', status: 'done' as const },
      { id: 'e', status: 'open' as const },
      { id: 'f', status: 'returned' as const },
    ];
    expect(sortByStatus(input).map((i) => i.id)).toEqual(['f', 'c', 'b', 'e', 'a', 'd']);
  });

  it('preserves the original order within the same status (stable sort)', () => {
    const input = [
      { id: 'a', status: 'in_progress' as const },
      { id: 'b', status: 'in_progress' as const },
      { id: 'c', status: 'in_progress' as const },
    ];
    expect(sortByStatus(input).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array unchanged', () => {
    expect(sortByStatus([])).toEqual([]);
  });
});

describe('countByStatus', () => {
  it('returns zero counts for an empty list', () => {
    expect(countByStatus([])).toEqual({ open: 0, in_progress: 0, returned: 0, done: 0 });
  });

  it('counts each status correctly', () => {
    const input = [
      { status: 'open' as const },
      { status: 'open' as const },
      { status: 'in_progress' as const },
      { status: 'returned' as const },
      { status: 'done' as const },
      { status: 'done' as const },
      { status: 'done' as const },
    ];
    expect(countByStatus(input)).toEqual({ open: 2, in_progress: 1, returned: 1, done: 3 });
  });
});
