import type { HotspotBlock } from '@/lib/schemas/blocks';
import { makeOptionId } from './form-helpers';
import { HOTSPOT_GROUP_COUNT } from '@/lib/blocks/hotspot-geometry';

// Pure Block-Transformationen für den Hotspot-Editor. Ausgelagert aus
// HotspotForm.tsx (Zeilen-Grenze). Jede Funktion nimmt den aktuellen Block +
// Parameter und liefert den NÄCHSTEN Block — die Komponente ruft `onChange(…)`.

type Block = HotspotBlock;
type Area = Block['areas'][number];

// Neue Zone anhängen. Liefert { next, id } — id wird gebraucht, um direkt das
// Label-Popup an der frischen Zone zu öffnen.
export function addArea(
  value: Block,
  base: { isCorrect: boolean; groupId: string | undefined },
  extra: Partial<Area>
): { next: Block; id: string } {
  const id = makeOptionId(value.areas, 'a');
  const area = {
    id,
    rotation: 0,
    isCorrect: base.isCorrect,
    groupId: base.groupId,
    ...extra,
  } as Area;
  return { next: { ...value, areas: [...value.areas, area] }, id };
}

export function updateArea(value: Block, index: number, patch: Partial<Area>): Block {
  return { ...value, areas: value.areas.map((a, i) => (i === index ? { ...a, ...patch } : a)) };
}

export function removeArea(value: Block, index: number): Block {
  if (value.areas.length <= 1) return value;
  return { ...value, areas: value.areas.filter((_, i) => i !== index) };
}

export function setAreaLabel(value: Block, areaId: string, label: string): Block {
  return {
    ...value,
    areas: value.areas.map((a) => (a.id === areaId ? { ...a, label: label || undefined } : a)),
  };
}

export function setAreaGroup(value: Block, areaId: string, groupId: string | undefined): Block {
  return {
    ...value,
    areas: value.areas.map((a) => (a.id === areaId ? { ...a, groupId } : a)),
  };
}

// Neue Gruppe anlegen (aktiviert ggf. den Gruppen-Modus) und der angegebenen
// Zone direkt zuordnen. Liefert { next, groupId } oder null, wenn das Maximum
// erreicht ist. groupId wird gebraucht, um `currentGroupId` mitzuziehen.
export function createGroupForArea(
  value: Block,
  areaId: string
): { next: Block; groupId: string } | null {
  const groups = value.groups ?? [];
  if (groups.length >= HOTSPOT_GROUP_COUNT) return null;
  const g = { id: makeOptionId(groups, 'g'), label: `Gruppe ${groups.length + 1}` };
  const next: Block = {
    ...value,
    groups: [...groups, g],
    areas: value.areas.map((a) => (a.id === areaId ? { ...a, groupId: g.id } : a)),
  };
  return { next, groupId: g.id };
}
