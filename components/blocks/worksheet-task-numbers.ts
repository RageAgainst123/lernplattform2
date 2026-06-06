import type { Block, BlockType } from '@/lib/schemas/blocks';

// Pure-Helper für die Worksheet-Aufgabe-Nummerierung. Theorie-Blöcke (text,
// infobox) erhalten KEINE „Aufgabe N"-Headline — nur interaktive Blöcke
// werden 1-basiert durchgezählt.

const INTERACTIVE_TYPES: ReadonlySet<BlockType> = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
  'match',
  'categorize',
  'reflection',
]);

export function isInteractive(type: BlockType): boolean {
  return INTERACTIVE_TYPES.has(type);
}

// Ordnet jedem interaktiven Block seine 1-basierte Aufgabe-Nr. zu. Theorie-
// Blöcke kommen NICHT in die Map.
export function buildTaskNumberMap(blocks: Block[]): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const block of blocks) {
    if (isInteractive(block.type)) {
      n += 1;
      map.set(block.id, n);
    }
  }
  return map;
}
