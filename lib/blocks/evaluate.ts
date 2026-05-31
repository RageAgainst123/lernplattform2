import type {
  Block,
  FillBlankBlock,
  MatchBlock,
  MultipleChoiceBlock,
  TrueFalseBlock,
} from '@/lib/schemas/blocks';

// Antwort-Formate pro auswertbarem Block-Typ.
export type MultipleChoiceAnswer = string[]; // gewählte Option-IDs
export type TrueFalseAnswer = boolean;
// Wörter in Platzhalter-Reihenfolge; null = noch leere Lücke (UI-Zustand).
export type FillBlankAnswer = (string | null)[];
export type MatchAnswer = Record<string, string>; // pairId → zugeordnete Kategorie
export type BlockAnswer =
  | MultipleChoiceAnswer
  | TrueFalseAnswer
  | FillBlankAnswer
  | MatchAnswer
  | string;

// Block-Typen ohne automatische Bewertung (reiner Inhalt, freie Antwort,
// Präsentationsfolie oder unbenotete Live-Abstimmung).
const NON_GRADED = new Set(['text', 'infobox', 'reflection', 'slide', 'live_poll']);

export function isGraded(block: Block): boolean {
  return !NON_GRADED.has(block.type);
}

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

function evalMultipleChoice(block: MultipleChoiceBlock, answer: MultipleChoiceAnswer): boolean {
  const correct = block.options.filter((o) => o.correct).map((o) => o.id);
  const given = [...new Set(answer)];
  return correct.length === given.length && correct.every((id) => given.includes(id));
}

function evalFillBlank(block: FillBlankBlock, answer: FillBlankAnswer): boolean {
  if (answer.length !== block.solutions.length) {
    return false;
  }
  return block.solutions.every((sol, i) => normalize(sol) === normalize(answer[i] ?? ''));
}

function evalMatch(block: MatchBlock, answer: MatchAnswer): boolean {
  return block.pairs.every((pair) => answer[pair.id] === pair.category);
}

// ─────────────────────────────────────────────────────────────────────────
// Erweiterbarkeit — einen NEUEN Block-Typ ins Scoring aufnehmen:
//   1. lib/schemas/blocks.ts  → Block-Typ + Antwort-Format (Zod) definieren
//   2. HIER in gradeBlock()   → einen `case` mit der Korrektheits-Prüfung
//   3. components/blocks/      → Renderer (Anzeige + Eingabe)
// Die gesamte Bewertungs-Pipeline (scoreModule / maxScore / percentScore /
// isPassed / Lehrer:innen-Matrix) läuft danach OHNE Änderung weiter, weil sie
// ausschließlich über gradeBlock() + isGraded() geht — nie typ-spezifisch.
//
// gradeBlock liefert ein TEILERGEBNIS 0.0–1.0. Heute ist jeder Block binär
// (0 oder 1). Für künftige TEILPUNKTE (z. B. 3 von 4 Zuordnungen = 0.75) nur
// hier den jeweiligen `case` auf einen Bruchwert umstellen — sonst nichts.
// ─────────────────────────────────────────────────────────────────────────
// Korrektheits-Prüfer pro auswertbarem Block-Typ, gibt boolean zurück. Ein neuer
// auto-bewertbarer Block-Typ braucht hier genau einen Eintrag (+ Schema + Renderer).
const CHECKERS: Record<string, (block: Block, answer: BlockAnswer | undefined) => boolean> = {
  multiple_choice: (b, a) =>
    evalMultipleChoice(b as MultipleChoiceBlock, (a as MultipleChoiceAnswer) ?? []),
  true_false: (b, a) => a === (b as TrueFalseBlock).answer,
  fill_blank: (b, a) => evalFillBlank(b as FillBlankBlock, (a as FillBlankAnswer) ?? []),
  match: (b, a) => evalMatch(b as MatchBlock, (a as MatchAnswer) ?? {}),
};

export function gradeBlock(block: Block, answer: BlockAnswer | undefined): number {
  const checker = CHECKERS[block.type];
  if (!checker) {
    // Nicht-bewertbare Blöcke (text/infobox/reflection) tragen nichts bei.
    return 0;
  }
  return checker(block, answer) ? 1 : 0;
}

// Boolesche Auswertung eines Blocks. Nicht-bewertbare Blöcke gelten als korrekt
// (z. B. Reflexion ohne richtige/falsche Antwort). Dünner Wrapper um gradeBlock,
// damit der Quiz-Flow (Sofort-Feedback) weiter mit boolean arbeiten kann.
export function evaluateBlock(block: Block, answer: BlockAnswer): boolean {
  if (!isGraded(block)) {
    return true;
  }
  return gradeBlock(block, answer) === 1;
}

// Punkte = Summe der Teilergebnisse über alle bewertbaren Blöcke. Solange
// gradeBlock binär ist, ist das ganzzahlig (smallint-kompatibel).
export function scoreModule(blocks: Block[], answers: Record<string, BlockAnswer>): number {
  return blocks
    .filter(isGraded)
    .reduce((sum, block) => sum + gradeBlock(block, answers[block.id]), 0);
}

// Maximalpunktzahl = Anzahl bewertbarer Blöcke.
export function maxScore(blocks: Block[]): number {
  return blocks.filter(isGraded).length;
}

// Prozent-Score über die bewertbaren Blöcke. null, wenn es keine bewertbaren
// Blöcke gibt (max <= 0) — dann ist eine %-Bewertung fachlich nicht anwendbar
// (z. B. ein Modul nur mit Reflexion/Text).
export function percentScore(score: number, max: number): number | null {
  if (max <= 0) {
    return null;
  }
  return Math.round((score / max) * 100);
}

// Bestanden = erreichte Prozent >= Schwelle. null, wenn keine Schwelle gesetzt
// ODER keine bewertbaren Blöcke vorhanden sind (Bestehen nicht anwendbar).
export function isPassed(score: number, max: number, threshold: number | null): boolean | null {
  if (threshold === null) {
    return null;
  }
  const pct = percentScore(score, max);
  if (pct === null) {
    return null;
  }
  return pct >= threshold;
}

// Ergebnis eines einzelnen Blocks für die Lehrer:innen-Detailansicht.
export type BlockResult = 'correct' | 'wrong' | 'ungraded';

export function blockResult(block: Block, answer: BlockAnswer | undefined): BlockResult {
  if (!isGraded(block)) {
    return 'ungraded';
  }
  return gradeBlock(block, answer) === 1 ? 'correct' : 'wrong';
}
