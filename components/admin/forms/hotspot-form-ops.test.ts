import { describe, expect, it } from 'vitest';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import {
  addArea,
  createGroupForArea,
  removeArea,
  setAreaGroup,
  setAreaLabel,
  updateArea,
} from './hotspot-form-ops';

const base: HotspotBlock = {
  id: 'hs',
  type: 'hotspot',
  instruction: 'Test',
  imageUrl: 'https://example.com/b.jpg',
  revealZones: true,
  areas: [{ id: 'a1', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, rotation: 0, isCorrect: true }],
};

describe('hotspot-form-ops', () => {
  it('addArea hängt eine Zone an + liefert ihre id', () => {
    const { next, id } = addArea(
      base,
      { isCorrect: false, groupId: undefined },
      { x: 0.2, y: 0.3 }
    );
    expect(next.areas).toHaveLength(2);
    expect(next.areas[1].id).toBe(id);
    expect(next.areas[1].isCorrect).toBe(false);
  });

  it('updateArea patcht nur die Zone am Index', () => {
    const next = updateArea(base, 0, { label: 'Maus' });
    expect(next.areas[0].label).toBe('Maus');
  });

  it('removeArea löscht — aber nie die letzte Zone', () => {
    const two = addArea(base, { isCorrect: true, groupId: undefined }, { x: 0.1, y: 0.1 }).next;
    expect(removeArea(two, 0).areas).toHaveLength(1);
    // Letzte Zone bleibt erhalten.
    expect(removeArea(base, 0).areas).toHaveLength(1);
  });

  it('setAreaLabel setzt undefined bei leerem String', () => {
    expect(setAreaLabel(base, 'a1', 'X').areas[0].label).toBe('X');
    expect(setAreaLabel(base, 'a1', '').areas[0].label).toBeUndefined();
  });

  it('createGroupForArea legt Gruppe an, aktiviert Gruppen-Modus + ordnet Zone zu', () => {
    const res = createGroupForArea(base, 'a1');
    expect(res).not.toBeNull();
    expect(res!.next.groups).toHaveLength(1);
    expect(res!.next.groups![0].id).toBe(res!.groupId);
    expect(res!.next.areas[0].groupId).toBe(res!.groupId);
  });

  it('createGroupForArea liefert null beim Maximum (6 Gruppen)', () => {
    const full: HotspotBlock = {
      ...base,
      groups: Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, label: `G${i}` })),
    };
    expect(createGroupForArea(full, 'a1')).toBeNull();
  });

  it('setAreaGroup ordnet eine Zone einer Gruppe zu (oder löst sie)', () => {
    const assigned = setAreaGroup(base, 'a1', 'gX');
    expect(assigned.areas[0].groupId).toBe('gX');
    expect(setAreaGroup(assigned, 'a1', undefined).areas[0].groupId).toBeUndefined();
  });
});
