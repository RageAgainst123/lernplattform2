import { z } from 'zod';

// Geteilte Schema-Bausteine für alle Block-Typen. Ausgelagert aus blocks.ts,
// damit typ-spezifische Schema-Dateien (z.B. blocks-label-image.ts) sie OHNE
// Zirkel-Import mit blocks.ts nutzen können.

export const blockId = z.string().min(1);

// Phase W (2026-06): Didaktische Kategorisierung für die BlockList-Gruppierung
// im Editor. Optional, damit Bestands-Blöcke gültig bleiben. 'theorie' =
// vermittelt, 'uebung' = trainiert, 'reflexion' = lässt nachdenken.
export const BLOCK_CATEGORIES = ['theorie', 'uebung', 'reflexion'] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];
const blockCategorySchema = z.enum(BLOCK_CATEGORIES);

// Phase W: Felder für bewertbare Blöcke. `hint` erscheint nach dem 1.
// Fehlversuch; `maxAttempts` = erlaubte Versuche (undefined = 1, je -25 %).
export const gradedBlockExtensions = {
  hint: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(5).optional(),
  category: blockCategorySchema.optional(),
};

// Für Theorie-/Live-Blöcke nur die category-Erweiterung.
export const taxonomyExtension = {
  category: blockCategorySchema.optional(),
};
