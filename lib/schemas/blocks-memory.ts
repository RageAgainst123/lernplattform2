import { z } from 'zod';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';

// Memory / Paare-Spiel: Schüler:in deckt zwei Karten auf; bilden sie ein
// definiertes Paar, bleiben sie offen, sonst klappen sie zurück. Tap-basiert
// (kein Drag), Teilpunkte (gefundene Paare / Anzahl Paare). Eine Karte trägt
// `text` ODER `imageUrl` → deckt Begriff–Begriff, Begriff–Definition und
// Begriff–Bild ohne extra Diskriminator ab. Geteilte Bausteine aus
// blocks-shared.ts → kein Zirkel-Import mit blocks.ts.

export const memoryCardContentSchema = z
  .object({
    text: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
  })
  .superRefine((c, ctx) => {
    const hasText = c.text !== undefined;
    const hasImg = c.imageUrl !== undefined;
    if (hasText === hasImg) {
      ctx.addIssue({
        code: 'custom',
        path: ['text'],
        message: 'Karte braucht genau text ODER imageUrl.',
      });
    }
  });

export const memoryPairSchema = z.object({
  id: z.string().min(1),
  a: memoryCardContentSchema, // erste Karte des Paares
  b: memoryCardContentSchema, // zweite Karte
});

export const memoryBlockSchema = z
  .object({
    id: blockId,
    type: z.literal('memory'),
    instruction: z.string(),
    pairs: z.array(memoryPairSchema).min(3).max(8),
    ...gradedBlockExtensions,
  })
  .superRefine((b, ctx) => {
    const ids = b.pairs.map((p) => p.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'pair-id muss eindeutig sein.' });
    }
  });
