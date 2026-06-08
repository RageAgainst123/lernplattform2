import { describe, expect, it } from 'vitest';
import {
  HOTSPOT_GROUP_COUNT,
  hotspotGroupColor,
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
