import { z } from 'zod';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';

// Buchstabensalat (scramble): pro Wort werden die Buchstaben deterministisch
// gemischt (lib/blocks/scramble.ts) und die Schüler:in tippt sie in der
// richtigen Reihenfolge an. Optionaler Hinweis pro Wort. Teilpunkte =
// richtige Wörter / alle Wörter. `word` nur Großbuchstaben (ß als „SS").
// Geteilte Bausteine aus blocks-shared.ts (kein Zirkel).

export const scrambleWordSchema = z.object({
  id: z.string().min(1),
  word: z
    .string()
    .min(2)
    .max(14)
    .regex(/^[A-ZÄÖÜ]+$/, 'Nur Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.'),
  hint: z.string().optional(), // z.B. „Eingabegerät mit Tasten"
});

export const scrambleBlockSchema = z
  .object({
    id: blockId,
    type: z.literal('scramble'),
    instruction: z.string(),
    words: z.array(scrambleWordSchema).min(1).max(8),
    ...gradedBlockExtensions,
  })
  .superRefine((b, ctx) => {
    const ids = b.words.map((w) => w.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['words'], message: 'word-id muss eindeutig sein.' });
    }
  });
