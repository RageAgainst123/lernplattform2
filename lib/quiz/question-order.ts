import type { Block } from '@/lib/schemas/blocks';
import type { QuizQuestionRef } from '@/lib/schemas/quiz';

// Modul-Blocks → quiz_sessions.question_order (Phase S, Migration 0020).
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §3.9.
//
// Filtert die für ein Live-Klassen-Quiz tauglichen Block-Typen heraus:
// MC, T/F, Lückentext. Match bleibt Solo-only, weil Drag&Drop am Handy mit
// Latenz und kleinem Display nicht praktikabel ist. Theorie-Blöcke (text,
// infobox, reflection, slide) werden für ein Live-Quiz übersprungen — sie
// gehören ins Lernmodul, nicht in den Wettkampf.
//
// Reihenfolge bleibt stabil (original-Modul-Reihenfolge), außer shuffle=true
// — dann wird per Seed deterministisch durchmischt. Damit ist die spätere
// Auswertung pro Frage-Index sinnvoll (gleiche Frage = gleicher Index).

const LIVE_QUIZ_TYPES = new Set<Block['type']>(['multiple_choice', 'true_false', 'fill_blank']);

export function isLiveQuizBlock(block: Block): boolean {
  return LIVE_QUIZ_TYPES.has(block.type);
}

export type BuildOptions = {
  shuffle?: boolean;
  // Seed für deterministisches Shuffle (vor allem für Tests). Wenn nicht
  // gesetzt UND shuffle=true → zufälliger Seed beim Bauen.
  seed?: number;
};

export function buildQuizQuestionOrder(
  blocks: Block[],
  opts: BuildOptions = {}
): QuizQuestionRef[] {
  const live = blocks
    .filter(isLiveQuizBlock)
    .map<QuizQuestionRef>((b) => ({ blockId: b.id, blockType: b.type }));

  if (!opts.shuffle || live.length < 2) return live;

  // Seedeter Fisher-Yates-Shuffle (mulberry32 als pure PRNG). In-place auf
  // einer Kopie, damit der Input nicht mutiert wird.
  const rng = mulberry32(opts.seed ?? 0);
  const arr = live.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Kleine deterministische 32-bit-PRNG (public-domain Algorithmus). Reicht
// für „shuffel ein Quiz von ~10 Fragen reproduzierbar" — nichts Security-
// kritisches.
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
