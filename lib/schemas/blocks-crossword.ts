import { z } from 'zod';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';
// Relativer Import mit .ts-Endung (kein @/-Alias): validate-module.mjs lädt
// die Schemas direkt via node --experimental-strip-types, ohne Alias-Auflösung.
import { buildCrosswordGrid } from '../blocks/crossword-grid.ts';

// Kreuzworträtsel (crossword): Autor:in legt Wörter mit Frage (clue),
// Richtung und Startzelle auf ein festes Gitter — KEIN Auto-Placement-Solver.
// Die füllbaren Zellen werden aus den Wörtern abgeleitet; Kreuzungen müssen
// im Buchstaben übereinstimmen (superRefine). Schüler:in tippt Zelle an und
// gibt Buchstaben ein. Teilpunkte = richtige Zellen / füllbare Zellen.
// `answer` nur Großbuchstaben (A–Z + Umlaute; ß als „SS" schreiben) → sauberer
// Per-Zellen-Vergleich. Geteilte Bausteine aus blocks-shared.ts (kein Zirkel).

export const crosswordWordSchema = z.object({
  id: z.string().min(1),
  answer: z
    .string()
    .min(2)
    .regex(/^[A-ZÄÖÜ]+$/, 'Nur Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.'),
  clue: z.string().min(1), // Frage/Hinweis
  direction: z.enum(['across', 'down']),
  row: z.number().int().min(0), // Startzelle (0-basiert)
  col: z.number().int().min(0),
});

export const crosswordBlockSchema = z
  .object({
    id: blockId,
    type: z.literal('crossword'),
    instruction: z.string(),
    rows: z.number().int().min(2).max(15),
    cols: z.number().int().min(2).max(15),
    words: z.array(crosswordWordSchema).min(2).max(10),
    ...gradedBlockExtensions,
  })
  .superRefine((b, ctx) => {
    const ids = b.words.map((w) => w.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['words'], message: 'word-id muss eindeutig sein.' });
    }
    for (const issue of buildCrosswordGrid(b.rows, b.cols, b.words).issues) {
      if (issue.type === 'outOfGrid') {
        ctx.addIssue({
          code: 'custom',
          path: ['words'],
          message: `Wort "${issue.wordId}" ragt aus dem Gitter (${b.rows}×${b.cols}).`,
        });
      } else {
        ctx.addIssue({
          code: 'custom',
          path: ['words'],
          message: `Kreuzungs-Konflikt bei Zelle (${issue.r},${issue.c}): "${issue.existing}" ≠ "${issue.incoming}" (Wort "${issue.wordId}").`,
        });
      }
    }
  });
