import type { LabelImageBlock } from '@/lib/schemas/blocks';
import { makeOptionId } from './form-helpers';

// Pure Block-Transformationen für den „Bild-Beschriften"-Editor (label_image).
// Analog zu hotspot-form-ops, aber ohne isCorrect/Gruppen — jede Zone hat genau
// einen Pflicht-Soll-Begriff (label). Jede Funktion liefert den NÄCHSTEN Block.

type Block = LabelImageBlock;
type Zone = Block['zones'][number];

// Neue Zone anhängen. Liefert { next, id } — id öffnet direkt das Label-Popup.
export function addZone(value: Block, extra: Partial<Zone>): { next: Block; id: string } {
  const id = makeOptionId(value.zones, 'z');
  const zone = { id, rotation: 0, label: '', ...extra } as Zone;
  return { next: { ...value, zones: [...value.zones, zone] }, id };
}

export function updateZone(value: Block, index: number, patch: Partial<Zone>): Block {
  return { ...value, zones: value.zones.map((z, i) => (i === index ? { ...z, ...patch } : z)) };
}

export function removeZone(value: Block, index: number): Block {
  if (value.zones.length <= 1) return value;
  return { ...value, zones: value.zones.filter((_, i) => i !== index) };
}

export function setZoneLabel(value: Block, zoneId: string, label: string): Block {
  return {
    ...value,
    zones: value.zones.map((z) => (z.id === zoneId ? { ...z, label } : z)),
  };
}
