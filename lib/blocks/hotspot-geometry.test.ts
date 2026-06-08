import { describe, expect, it } from 'vitest';
import {
  HOTSPOT_GROUP_COUNT,
  hitAreaIds,
  hotspotGroupColor,
  pointInArea,
  zoneBoxStyle,
  zoneShapeClass,
} from './hotspot-geometry';
import type { HotspotBlock } from '@/lib/schemas/blocks';

type Area = HotspotBlock['areas'][number];

const circle: Area = {
  id: 'c',
  x: 0.5,
  y: 0.5,
  shape: 'circle',
  r: 0.1,
  rotation: 0,
  isCorrect: true,
};
const rect: Area = {
  id: 'r',
  x: 0.3,
  y: 0.7,
  shape: 'rect',
  width: 0.2,
  height: 0.1,
  rotation: 45,
  isCorrect: false,
};
// Bestands-Zone OHNE shape/rotation (Rückwärtskompat).
const legacy = { id: 'l', x: 0.4, y: 0.6, r: 0.08, isCorrect: true } as Area;

describe('zoneBoxStyle', () => {
  it('positioniert mittig via translate', () => {
    expect(zoneBoxStyle(circle).left).toBe('50%');
    expect(zoneBoxStyle(circle).top).toBe('50%');
    expect(zoneBoxStyle(circle).transform).toContain('translate(-50%, -50%)');
  });

  it('Kreis: Breite = 2·r, keine aspectRatio', () => {
    const s = zoneBoxStyle(circle);
    expect(s.width).toBe('20%');
    expect(s.aspectRatio).toBeUndefined();
  });

  it('Rechteck: Breite = width% (rel. Breite), Höhe = height% (rel. Höhe), keine aspectRatio', () => {
    const s = zoneBoxStyle(rect);
    expect(s.width).toBe('20%');
    expect(s.height).toBe('10%');
    expect(s.aspectRatio).toBeUndefined();
  });

  it('übernimmt die Rotation in den transform', () => {
    expect(zoneBoxStyle(rect).transform).toContain('rotate(45deg)');
    expect(zoneBoxStyle(circle).transform).toContain('rotate(0deg)');
  });

  it('Bestands-Zone ohne shape/rotation wird als Kreis behandelt (Rückwärtskompat)', () => {
    const s = zoneBoxStyle(legacy);
    expect(s.width).toBe('16%'); // 2·0.08
    expect(s.transform).toContain('rotate(0deg)');
    expect(s.aspectRatio).toBeUndefined();
  });
});

describe('zoneShapeClass', () => {
  it('Kreis erzwingt aspect-square + rounded-full', () => {
    expect(zoneShapeClass(circle)).toContain('aspect-square');
    expect(zoneShapeClass(circle)).toContain('rounded-full');
  });
  it('Rechteck nur rounded-md', () => {
    expect(zoneShapeClass(rect)).toBe('rounded-md');
  });
  it('Bestands-Zone (kein shape) = Kreis', () => {
    expect(zoneShapeClass(legacy)).toContain('rounded-full');
  });
});

describe('hotspotGroupColor', () => {
  it('liefert pro Index eine border+bg-Klasse', () => {
    expect(hotspotGroupColor(0)).toMatch(/border-/);
    expect(hotspotGroupColor(0)).toMatch(/bg-/);
  });
  it('unterscheidet die ersten Gruppen farblich', () => {
    expect(hotspotGroupColor(0)).not.toBe(hotspotGroupColor(1));
  });
  it('wrappt über die Palette (Index >= Palettengröße)', () => {
    expect(hotspotGroupColor(HOTSPOT_GROUP_COUNT)).toBe(hotspotGroupColor(0));
  });
});

describe('pointInArea', () => {
  it('Kreis: Mittelpunkt + Rand innen, weit weg außen', () => {
    // circle: x=0.5,y=0.5,r=0.1
    expect(pointInArea(circle, 0.5, 0.5)).toBe(true);
    expect(pointInArea(circle, 0.59, 0.5)).toBe(true); // knapp innerhalb r
    expect(pointInArea(circle, 0.7, 0.5)).toBe(false); // außerhalb r
    expect(pointInArea(circle, 0.5, 0.8)).toBe(false);
  });

  it('Kreis: aspect skaliert die y-Distanz (hohes Bild)', () => {
    // aspect=2 (Bild doppelt so hoch wie breit) → 0.05 in y zählt wie 0.1 in x.
    // Ohne aspect-Korrektur (=1) wäre 0.05 noch klar innen; mit aspect=2 raus.
    expect(pointInArea(circle, 0.5, 0.54, 2)).toBe(true); // dy=0.04*2=0.08 < r
    expect(pointInArea(circle, 0.5, 0.54, 1)).toBe(true); // dy=0.04 < r ohnehin
    expect(pointInArea(circle, 0.5, 0.6, 2)).toBe(false); // dy=0.1*2=0.2 > r
  });

  it('Rechteck (rotation 0): innerhalb der halben Breite/Höhe', () => {
    const r0: Area = { ...rect, rotation: 0 }; // x=0.3,y=0.7,w=0.2,h=0.1
    expect(pointInArea(r0, 0.3, 0.7)).toBe(true); // Mitte
    expect(pointInArea(r0, 0.39, 0.74)).toBe(true); // knapp drin (|dx|<0.1, |dy|<0.05)
    expect(pointInArea(r0, 0.41, 0.7)).toBe(false); // dx=0.11 > 0.1
    expect(pointInArea(r0, 0.3, 0.76)).toBe(false); // dy=0.06 > 0.05
  });

  it('Rechteck rotiert 45°: gedrehte Ecke trifft, Achsen-Ecke nicht', () => {
    // quadratisches rect, rotation 45°, aspect 1 → Diamant-Form
    const sq: Area = {
      id: 's',
      x: 0.5,
      y: 0.5,
      shape: 'rect',
      width: 0.2,
      height: 0.2,
      rotation: 45,
      isCorrect: true,
    };
    expect(pointInArea(sq, 0.5, 0.5, 1)).toBe(true); // Mitte immer drin
    // Punkt direkt rechts (0.09 in x) liegt im gedrehten Quadrat (Diagonale ~0.14)
    expect(pointInArea(sq, 0.59, 0.5, 1)).toBe(true);
    // Punkt diagonal raus: bei 45° ist die echte Ecke bei (±0.1,±0.1) rotiert →
    // ein achsen-diagonaler Punkt (0.6,0.6) liegt außerhalb
    expect(pointInArea(sq, 0.6, 0.6, 1)).toBe(false);
  });
});

describe('hitAreaIds', () => {
  const a1: Area = {
    id: 'a1',
    x: 0.3,
    y: 0.3,
    shape: 'circle',
    r: 0.1,
    rotation: 0,
    isCorrect: true,
  };
  const a2: Area = {
    id: 'a2',
    x: 0.7,
    y: 0.7,
    shape: 'circle',
    r: 0.1,
    rotation: 0,
    isCorrect: false,
  };
  it('liefert die getroffenen Zonen-IDs', () => {
    expect(hitAreaIds([a1, a2], 0.3, 0.3)).toEqual(['a1']);
    expect(hitAreaIds([a1, a2], 0.7, 0.7)).toEqual(['a2']);
  });
  it('leeres Array wenn daneben geklickt', () => {
    expect(hitAreaIds([a1, a2], 0.5, 0.5)).toEqual([]);
  });
});
