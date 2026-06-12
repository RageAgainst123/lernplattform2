import { z } from 'zod';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';
// Relativer Import mit .ts-Endung (kein @/-Alias): validate-module.mjs lädt
// die Schemas direkt via node --experimental-strip-types, ohne Alias-Auflösung.
import { buildWordSearchGrid } from '../blocks/word-search-grid.ts';

// Wortsuchrätsel (word_search): Autor:in legt Wörter mit Richtung (waagrecht,
// senkrecht, diagonal nach rechts unten) und Startzelle auf ein festes Gitter —
// KEIN Auto-Placement. Leere Zellen werden im Renderer deterministisch mit
// Füllbuchstaben aufgefüllt (seeded, hydration-sicher). Schüler:in markiert
// ein Wort per Antippen von Start- + End-Zelle. Teilpunkte = gefundene /
// alle Wörter. `word` nur Großbuchstaben (ß als „SS") → sauberer Zellvergleich.
// Geteilte Bausteine aus blocks-shared.ts (kein Zirkel).

export const wordSearchWordSchema = z.object({
  id: z.string().min(1),
  word: z
    .string()
    .min(2)
    .regex(/^[A-ZÄÖÜ]+$/, 'Nur Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.'),
  direction: z.enum(['across', 'down', 'diag']),
  row: z.number().int().min(0), // Startzelle (0-basiert)
  col: z.number().int().min(0),
});

export const wordSearchBlockSchema = z
  .object({
    id: blockId,
    type: z.literal('word_search'),
    instruction: z.string(),
    rows: z.number().int().min(5).max(15),
    cols: z.number().int().min(5).max(15),
    words: z.array(wordSearchWordSchema).min(3).max(12),
    ...gradedBlockExtensions,
  })
  .superRefine((b, ctx) => {
    const ids = b.words.map((w) => w.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['words'], message: 'word-id muss eindeutig sein.' });
    }
    // Gleicher Wort-TEXT doppelt wäre mehrdeutig: die Auswahl der Schüler:in
    // könnte nicht eindeutig einem Eintrag zugeordnet werden.
    const texts = b.words.map((w) => w.word.toUpperCase());
    if (new Set(texts).size !== texts.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['words'],
        message: 'Jedes Wort darf nur einmal vorkommen (sonst mehrdeutig).',
      });
    }
    for (const issue of buildWordSearchGrid(b.rows, b.cols, b.words).issues) {
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
