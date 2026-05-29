import { describe, expect, it } from 'vitest';
import { groupByBereich } from './public-content-stufe';
import type { PublicMaterial } from './public-content';
import type { Kompetenzbereich } from '@/lib/schemas/entities';

// Pure-Logic-Tests: kein DB-Mock. Der DB-Wrapper getStufeWithBereiche reicht
// die Rows nur durch — Browser-Smoke deckt das ab.

function mat(id: string, title: string): PublicMaterial {
  return {
    id,
    title,
    description: null,
    materialType: 'arbeitsblatt',
    fileUrl: `https://example/storage/${id}.pdf`,
    relatedModuleId: null,
  };
}

describe('groupByBereich', () => {
  it('returns an empty map when nothing is given', () => {
    const result = groupByBereich([], []);
    expect(result.size).toBe(0);
  });

  it('groups by bereich and topic, with alphabetic topic order per bereich', () => {
    const result = groupByBereich(
      [
        {
          material: mat('m1', 'B'),
          topic: 'EVA-Prinzip',
          bereich: 'orientierung' as Kompetenzbereich,
        },
        {
          material: mat('m2', 'A'),
          topic: 'EVA-Prinzip',
          bereich: 'orientierung' as Kompetenzbereich,
        },
        { material: mat('m3', 'X'), topic: 'Suchen', bereich: 'information' as Kompetenzbereich },
      ],
      [
        {
          id: 'u1',
          title: 'Quiz',
          description: null,
          topic: 'EVA-Prinzip',
          kompetenzbereich: 'orientierung' as Kompetenzbereich,
        },
      ]
    );
    expect(result.size).toBe(2);
    const orient = result.get('orientierung' as Kompetenzbereich);
    expect(orient).toBeDefined();
    expect(orient).toHaveLength(1);
    expect(orient?.[0].topic).toBe('EVA-Prinzip');
    expect(orient?.[0].materials.map((m) => m.title)).toEqual(['A', 'B']);
    expect(orient?.[0].modules.map((m) => m.title)).toEqual(['Quiz']);
    const info = result.get('information' as Kompetenzbereich);
    expect(info?.[0].topic).toBe('Suchen');
  });

  it('discards rows without a kompetenzbereich', () => {
    const result = groupByBereich(
      [
        { material: mat('m1', 'A'), topic: 'X', bereich: null },
        { material: mat('m2', 'B'), topic: 'X', bereich: 'orientierung' as Kompetenzbereich },
      ],
      [
        { id: 'u1', title: 'Q', description: null, topic: 'X', kompetenzbereich: null },
        {
          id: 'u2',
          title: 'R',
          description: null,
          topic: 'X',
          kompetenzbereich: 'orientierung' as Kompetenzbereich,
        },
      ]
    );
    expect(result.size).toBe(1);
    const orient = result.get('orientierung' as Kompetenzbereich);
    expect(orient?.[0].materials).toHaveLength(1);
    expect(orient?.[0].modules).toHaveLength(1);
  });

  it('handles a bereich that has only modules (no materials)', () => {
    const result = groupByBereich(
      [],
      [
        {
          id: 'u1',
          title: 'Quiz',
          description: null,
          topic: 'Nur-Modul',
          kompetenzbereich: 'kommunikation' as Kompetenzbereich,
        },
      ]
    );
    const komm = result.get('kommunikation' as Kompetenzbereich);
    expect(komm).toHaveLength(1);
    expect(komm?.[0].materials).toEqual([]);
    expect(komm?.[0].modules.map((m) => m.title)).toEqual(['Quiz']);
  });
});
