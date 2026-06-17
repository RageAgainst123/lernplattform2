import type { BlockType } from '../schemas/blocks.ts';
import type { BlockDoc } from './block-docs-types.ts';

// Block-Self-Doc-Registry (B2, docs/AI-AUTHORING-DX.md §2).
//
// EIN Ort pro Block-Typ für den menschen- + KI-lesbaren Doku-Layer: KI-Hinweise
// (die typischen Fallen, die ein Schema allein nicht ausdrückt), Antwort-Format
// und ein vollständiges, gegen das Schema geprüftes Beispiel. Speist den
// B1-Auto-Export (scripts/export-schema.mjs → docs/generated/block-fields.md),
// sodass die KI-Referenz pro Typ nicht nur die Struktur, sondern auch Tipps +
// ein Beispiel enthält — IMMER code-treu, kein manuelles Nachpflegen mehr.
//
// WICHTIG — additiver Layer: label/Beschreibung/Gruppe bleiben Quelle im
// Editor-Katalog (components/admin/block-catalog.ts); die Bewertung bleibt in
// lib/blocks/evaluate.ts. block-docs.test.ts erzwingt Vollständigkeit (jeder
// Typ ein Eintrag) + Konsistenz (group == Katalog-Gruppe, graded == evaluate).
//
// Relative .ts-Imports (kein @/-Alias): wird auch von export-schema.mjs via
// node --experimental-strip-types geladen.

import { STATIC_DOCS } from './block-docs-static.ts';
import { QUIZ_DOCS } from './block-docs-quiz.ts';
import { GAME_DOCS } from './block-docs-game.ts';
import { IMAGE_DOCS } from './block-docs-image.ts';
import { LIVE_DOCS } from './block-docs-live.ts';

export type { BlockGroup, Gradedness, BlockDoc } from './block-docs-types.ts';

// Zusammengeführte Registry über alle 23 Block-Typen. Aufgeteilt in Themen-
// Dateien (Zeilen-Limit 200/Datei), hier nur gemerged. Die Splits sind
// Record<string, …> (TS kann die Exhaustivität über den Spread nicht beweisen);
// die Vollständigkeit garantiert stattdessen block-docs.test.ts zur Laufzeit.
export const BLOCK_DOCS = {
  ...STATIC_DOCS,
  ...QUIZ_DOCS,
  ...GAME_DOCS,
  ...IMAGE_DOCS,
  ...LIVE_DOCS,
} as Record<BlockType, BlockDoc>;

export function getBlockDoc(type: BlockType): BlockDoc {
  return BLOCK_DOCS[type];
}
