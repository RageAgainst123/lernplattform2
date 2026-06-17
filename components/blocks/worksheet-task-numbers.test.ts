import { describe, expect, it } from 'vitest';
import type { Block } from '@/lib/schemas/blocks';
import { buildTaskNumberMap, isInteractive } from '@/components/blocks/worksheet-task-numbers';

// Sichert die Worksheet-Aufgabe-Nummerierung ab. Kritisch: jeder bewertbare
// Aufgabentyp MUSS interaktiv sein, sonst rendert er ohne „Aufgabe N"-Headline
// wie ein Lesetext (Bug aus Phase A1: categorize fehlte in der Menge).

describe('isInteractive', () => {
  it('zählt alle bewertbaren Aufgabentypen als interaktiv', () => {
    for (const type of [
      'multiple_choice',
      'true_false',
      'fill_blank',
      'match',
      'categorize',
      'reflection',
    ] as const) {
      expect(isInteractive(type)).toBe(true);
    }
  });

  it('zählt Theorie-Blöcke NICHT als interaktiv', () => {
    expect(isInteractive('text')).toBe(false);
    expect(isInteractive('infobox')).toBe(false);
    expect(isInteractive('slide')).toBe(false);
  });
});

describe('buildTaskNumberMap', () => {
  it('nummeriert nur interaktive Blöcke 1-basiert durch', () => {
    const blocks = [
      { id: 't1', type: 'text', content: 'x', category: 'theorie' },
      { id: 'mc', type: 'multiple_choice', question: 'q', options: [], category: 'uebung' },
      { id: 'i1', type: 'infobox', title: 't', content: 'x', category: 'theorie' },
      {
        id: 'cat',
        type: 'categorize',
        buckets: [{ id: 'b1', label: 'A' }],
        items: [{ id: 'i', text: 'x', bucketId: 'b1' }],
        category: 'uebung',
      },
    ] as unknown as Block[];
    const map = buildTaskNumberMap(blocks);
    expect(map.get('mc')).toBe(1);
    expect(map.get('cat')).toBe(2);
    // Theorie-Blöcke bekommen keine Nummer.
    expect(map.has('t1')).toBe(false);
    expect(map.has('i1')).toBe(false);
  });
});
