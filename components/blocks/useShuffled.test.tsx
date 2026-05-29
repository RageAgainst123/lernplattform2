import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useShuffled } from './useShuffled';

// Was getestet wird:
//   1. Beim Server-Render (renderToString → useEffect läuft NICHT) liefert
//      der Hook die Items in Originalreihenfolge → identisch zu dem, was
//      später bei der ersten Client-Render-Iteration vor useEffect gesetzt
//      ist → kein Hydration-Mismatch.
//   2. Nach Mount im Client (renderHook in jsdom; useEffect läuft synchron im
//      Act-Batch) liegt eine gemischte Reihenfolge vor — gleiche Inhalte, nur
//      Reihenfolge verändert.
//   3. Bei Identitätswechsel der items-Prop wird neu gemischt.

afterEach(() => {
  vi.restoreAllMocks();
});

// Mini-Komponente, die den Hook-Output als JSON serialisiert, damit
// renderToString eine prüfbare Markup-Form liefert.
function HookProbe({ items }: { items: string[] }) {
  const out = useShuffled(items);
  return <span data-testid="probe">{JSON.stringify(out)}</span>;
}

describe('useShuffled', () => {
  it('returns items in original order during server render (hydration-safe)', () => {
    // Math.random sollte gar nicht aufgerufen werden — useEffect läuft auf
    // dem Server nicht. Trotzdem zur Sicherheit deterministisch mocken.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = ['a', 'b', 'c', 'd'];
    const html = renderToString(<HookProbe items={items} />);
    // renderToString HTML-escaped die JSON-Anführungszeichen → &quot;
    const expectedEscaped = JSON.stringify(items).replace(/"/g, '&quot;');
    expect(html).toContain(expectedEscaped);
  });

  it('returns a shuffled order after mount effect runs', () => {
    // Math.random konstant auf 0 → Fisher-Yates schiebt immer ans Ende →
    // Resultat ist die umgekehrte Reihenfolge der Eingabe.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = ['a', 'b', 'c', 'd'];
    const { result } = renderHook(() => useShuffled(items));
    // Nach Mount: useEffect hat gefeuert und neuen Wert gesetzt
    expect(result.current).not.toEqual(items);
    // Inhalt muss erhalten sein, nur die Reihenfolge ändert sich
    expect(result.current.slice().sort()).toEqual(items.slice().sort());
  });

  it('reshuffles when items array identity changes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items1 = ['a', 'b'];
    const items2 = ['x', 'y', 'z'];
    const { result, rerender } = renderHook(({ items }) => useShuffled(items), {
      initialProps: { items: items1 },
    });
    rerender({ items: items2 });
    expect(result.current.slice().sort()).toEqual(items2.slice().sort());
  });
});
