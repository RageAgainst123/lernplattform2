import { describe, expect, it } from 'vitest';
import { moduleContentSchema, moduleContentStrictSchema } from './blocks.ts';
import { publishGateIssues } from './blocks-refine.ts';
import type { Block } from './blocks.ts';

// EDIT-CRIT-1: fachliche IMMER-Regeln laufen jetzt im Schema (Schreib-Grenzen),
// nicht mehr nur in scripts/validate-module.mjs. Das LESE-Schema
// (moduleContentSchema) bleibt bewusst lenient — Bestands-Inhalte dürfen durch
// neue Regeln nie unlesbar werden.

function strictMessages(blocks: unknown[]): string[] {
  const result = moduleContentStrictSchema.safeParse({ blocks });
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

const validMc = {
  id: 'mc1',
  type: 'multiple_choice',
  question: 'Frage?',
  options: [
    { id: 'o1', text: 'A', correct: true },
    { id: 'o2', text: 'B', correct: false },
  ],
};

describe('moduleContentStrictSchema — IMMER-Regeln', () => {
  it('akzeptiert ein gültiges Modul', () => {
    expect(strictMessages([validMc])).toEqual([]);
  });

  it('lehnt doppelte Block-ids ab', () => {
    const msgs = strictMessages([
      { id: 'b1', type: 'text', content: 'x' },
      { id: 'b1', type: 'text', content: 'y' },
    ]);
    expect(msgs.join(' ')).toContain('Doppelte Block-id "b1"');
  });

  it('lehnt multiple_choice ohne richtige Option ab — LESE-Schema bleibt lenient', () => {
    const mc = {
      ...validMc,
      options: validMc.options.map((o) => ({ ...o, correct: false })),
    };
    expect(strictMessages([mc]).join(' ')).toContain('keine Option mit "correct": true');
    expect(moduleContentSchema.safeParse({ blocks: [mc] }).success).toBe(true);
  });

  it('lehnt doppelte Options-id in multiple_choice ab', () => {
    const mc = {
      ...validMc,
      options: [
        { id: 'o1', text: 'A', correct: true },
        { id: 'o1', text: 'B', correct: false },
      ],
    };
    expect(strictMessages([mc]).join(' ')).toContain('doppelte Options-id "o1"');
  });

  it('lehnt fill_blank mit Platzhalter/solutions-Drift ab', () => {
    const fb = {
      id: 'fb1',
      type: 'fill_blank',
      text: 'Ein {0} und ein {1}.',
      solutions: ['Maus'],
      distractors: [],
    };
    expect(strictMessages([fb]).join(' ')).toContain('Platzhalter bis {1}, aber 1 solutions');
  });

  it('lehnt match mit nur einer Kategorie ab', () => {
    const m = {
      id: 'm1',
      type: 'match',
      pairs: [
        { id: 'p1', term: 'A', category: 'K1' },
        { id: 'p2', term: 'B', category: 'K1' },
      ],
    };
    expect(strictMessages([m]).join(' ')).toContain('nur 1 Kategorie(n)');
  });

  it('lehnt categorize-Item mit unbekanntem Behälter ab', () => {
    const c = {
      id: 'c1',
      type: 'categorize',
      buckets: [
        { id: 'b1', label: 'B1' },
        { id: 'b2', label: 'B2' },
      ],
      items: [
        { id: 'i1', text: 'A', bucketId: 'b1' },
        { id: 'i2', text: 'B', bucketId: 'NOPE' },
      ],
    };
    expect(strictMessages([c]).join(' ')).toContain('item "i2" zeigt auf unbekannten Behälter');
  });

  it('lehnt mark_words mit correctIndex außerhalb ab', () => {
    const mw = {
      id: 'mw1',
      type: 'mark_words',
      instruction: 'Markiere.',
      text: 'Anna wohnt in Wien', // 4 Wörter → Index max 3
      correctIndices: [0, 4],
    };
    expect(strictMessages([mw]).join(' ')).toContain('correctIndex 4 liegt außerhalb');
  });

  it('lehnt order mit leerem item-text ab', () => {
    const o = {
      id: 'o1',
      type: 'order',
      instruction: 'Sortiere.',
      items: [
        { id: 'i1', text: 'Erster' },
        { id: 'i2', text: '   ' },
      ],
    };
    expect(strictMessages([o]).join(' ')).toContain('leerer item-text');
  });

  it('lehnt hotspot-Zone mit unbekannter Gruppe ab', () => {
    const hs = {
      id: 'hs1',
      type: 'hotspot',
      instruction: 'Tippe an.',
      imageUrl: 'https://example.com/bild.jpg',
      groups: [{ id: 'g1', label: 'Gruppe 1' }],
      areas: [
        { id: 'a1', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, isCorrect: true, groupId: 'g9' },
      ],
    };
    expect(strictMessages([hs]).join(' ')).toContain('verweist auf unbekannte Gruppe');
  });

  it('akzeptiert hotspot OHNE Zonen als Entwurf (Editor-Flow)', () => {
    const hs = {
      id: 'hs1',
      type: 'hotspot',
      instruction: 'Tippe an.',
      imageUrl: 'https://example.com/bild.jpg',
      areas: [],
    };
    expect(strictMessages([hs])).toEqual([]);
  });
});

describe('publishGateIssues — Entwurf erlaubt, Veröffentlichen blockiert', () => {
  const parse = (blocks: unknown[]): Block[] => {
    const r = moduleContentStrictSchema.safeParse({ blocks });
    if (!r.success) throw new Error(r.error.message);
    return r.data.blocks;
  };

  it('leeres Gate für Modul ohne hotspot/label_image', () => {
    expect(publishGateIssues(parse([validMc]))).toEqual([]);
  });

  it('hotspot ohne Zonen → Gate-Fehler', () => {
    const blocks = parse([
      {
        id: 'hs1',
        type: 'hotspot',
        instruction: 'Tippe an.',
        imageUrl: 'https://example.com/bild.jpg',
        areas: [],
      },
    ]);
    expect(publishGateIssues(blocks).join(' ')).toContain('keine Zonen gezeichnet');
  });

  it('hotspot ohne richtige Zone → Gate-Fehler', () => {
    const blocks = parse([
      {
        id: 'hs1',
        type: 'hotspot',
        instruction: 'Tippe an.',
        imageUrl: 'https://example.com/bild.jpg',
        areas: [{ id: 'a1', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, isCorrect: false }],
      },
    ]);
    expect(publishGateIssues(blocks).join(' ')).toContain('mindestens eine Zone muss richtig');
  });

  it('hotspot-Gruppe ohne richtige Zone → Gate-Fehler', () => {
    const blocks = parse([
      {
        id: 'hs1',
        type: 'hotspot',
        instruction: 'Tippe an.',
        imageUrl: 'https://example.com/bild.jpg',
        groups: [
          { id: 'g1', label: 'Eingabe' },
          { id: 'g2', label: 'Ausgabe' },
        ],
        areas: [
          { id: 'a1', x: 0.3, y: 0.5, shape: 'circle', r: 0.1, isCorrect: true, groupId: 'g1' },
          { id: 'a2', x: 0.7, y: 0.5, shape: 'circle', r: 0.1, isCorrect: false, groupId: 'g2' },
        ],
      },
    ]);
    expect(publishGateIssues(blocks).join(' ')).toContain(
      'Gruppe "Ausgabe" hat keine richtige Zone'
    );
  });

  it('label_image mit doppelten Begriffen → Gate-Fehler', () => {
    const blocks = parse([
      {
        id: 'li1',
        type: 'label_image',
        instruction: 'Beschrifte.',
        imageUrl: 'https://example.com/bild.jpg',
        zones: [
          { id: 'z1', label: 'Maus', x: 0.3, y: 0.4, shape: 'circle', r: 0.08 },
          { id: 'z2', label: 'Maus', x: 0.7, y: 0.4, shape: 'circle', r: 0.08 },
        ],
      },
    ]);
    expect(publishGateIssues(blocks).join(' ')).toContain('Begriff "Maus" doppelt');
  });

  it('vollständiger hotspot + eindeutige label_image-Begriffe → Gate leer', () => {
    const blocks = parse([
      {
        id: 'hs1',
        type: 'hotspot',
        instruction: 'Tippe an.',
        imageUrl: 'https://example.com/bild.jpg',
        areas: [{ id: 'a1', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, isCorrect: true }],
      },
      {
        id: 'li1',
        type: 'label_image',
        instruction: 'Beschrifte.',
        imageUrl: 'https://example.com/bild.jpg',
        zones: [
          { id: 'z1', label: 'Maus', x: 0.3, y: 0.4, shape: 'circle', r: 0.08 },
          { id: 'z2', label: 'Monitor', x: 0.7, y: 0.4, shape: 'circle', r: 0.08 },
        ],
      },
    ]);
    expect(publishGateIssues(blocks)).toEqual([]);
  });
});
