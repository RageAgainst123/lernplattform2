import { describe, expect, it } from 'vitest';
import { progressStatusMap } from './student-modules-status';

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
});
