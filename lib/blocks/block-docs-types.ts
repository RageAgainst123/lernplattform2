import { z } from 'zod';
import type { BlockType, blockSchema } from '../schemas/blocks.ts';

// Geteilter Typ für die Block-Self-Doc-Registry (B2). Eigene Datei, damit die
// Themen-Splits (block-docs-static/quiz/game/image/live.ts) ihn importieren
// können, OHNE einen Zirkel mit block-docs.ts (das die Splits mergt).

export type BlockGroup = 'theory' | 'worksheet' | 'live';
export type Gradedness = 'none' | 'binary' | 'partial';

// example = die EINGABE-Form eines Blocks (so wie ein:e Autor:in / die KI ihn
// schreibt): Felder mit z.B. .default() dürfen weggelassen werden, genau wie im
// echten Modul-JSON. blockSchema.safeParse(example) füllt sie beim Test.
export type BlockExample = z.input<typeof blockSchema>;

export interface BlockDoc {
  type: BlockType;
  group: BlockGroup;
  graded: Gradedness;
  aiHints: string[];
  answerFormat: string;
  example: BlockExample;
  editorOnly?: boolean;
}
