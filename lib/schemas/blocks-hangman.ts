import { z } from 'zod';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';

// Galgenmännchen (hangman): Wort Buchstabe für Buchstabe erraten, begrenzte
// Fehlversuche (Herzen statt Galgen — kindgerechter). Pro Wort ein
// PFLICHT-Hinweis, sonst ist reines Raten frustrierend. Die Wörter werden
// nacheinander gespielt. Antwort = wordIds der gelösten Wörter; Teilpunkte =
// gelöste / alle Wörter (foundRatio in evaluate.ts). `word` nur
// Großbuchstaben (ß als „SS"). Geteilte Bausteine aus blocks-shared.ts.

export const hangmanWordSchema = z.object({
  id: z.string().min(1),
  word: z
    .string()
    .min(2)
    .max(14)
    .regex(/^[A-ZÄÖÜ]+$/, 'Nur Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.'),
  hint: z.string().min(1), // Pflicht: „Eingabegerät mit Tasten"
});

export const hangmanBlockSchema = z
  .object({
    id: blockId,
    type: z.literal('hangman'),
    instruction: z.string(),
    words: z.array(hangmanWordSchema).min(1).max(6),
    // Erlaubte Fehlversuche pro Wort (Default 6 = klassisch).
    maxWrong: z.number().int().min(3).max(10).default(6),
    ...gradedBlockExtensions,
  })
  .superRefine((b, ctx) => {
    const ids = b.words.map((w) => w.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['words'], message: 'word-id muss eindeutig sein.' });
    }
  });
