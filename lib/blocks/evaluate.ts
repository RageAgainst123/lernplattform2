import type {
  Block,
  CategorizeBlock,
  FillBlankBlock,
  HotspotBlock,
  MarkWordsBlock,
  MatchBlock,
  MultipleChoiceBlock,
  OrderBlock,
  TrueFalseBlock,
} from '@/lib/schemas/blocks';
import { isFuzzyMatch } from '@/lib/blocks/levenshtein';

// Antwort-Formate pro auswertbarem Block-Typ.
export type MultipleChoiceAnswer = string[]; // gewählte Option-IDs
export type TrueFalseAnswer = boolean;
// Wörter in Platzhalter-Reihenfolge; null = noch leere Lücke (UI-Zustand).
export type FillBlankAnswer = (string | null)[];
export type MatchAnswer = Record<string, string>; // pairId → zugeordnete Kategorie
export type CategorizeAnswer = Record<string, string>; // itemId → gewählter bucketId
export type MarkWordsAnswer = number[]; // markierte wordIndex
export type OrderAnswer = string[]; // itemIds in gewählter Reihenfolge
export type HotspotAnswer = string[]; // angetippte areaIds
export type BlockAnswer =
  | MultipleChoiceAnswer
  | TrueFalseAnswer
  | FillBlankAnswer
  | MatchAnswer
  | CategorizeAnswer
  | MarkWordsAnswer
  | OrderAnswer
  | HotspotAnswer
  | string;

// Block-Typen ohne automatische Bewertung (reiner Inhalt, freie Antwort,
// Präsentationsfolie oder unbenotete Live-Interaktion).
const NON_GRADED = new Set([
  'text',
  'infobox',
  'reflection',
  'slide',
  'live_poll',
  'quiz_poll',
  'word_cloud',
  'scale',
  'understanding',
]);

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
  // Tippfehlertoleranz per Default (Levenshtein ≤ 1 ab 4 Buchstaben). Über
  // block.strict=true (z. B. für Fachbegriffe) wird wieder exakter Vergleich
  // erzwungen. Siehe docs/QUIZ-MODI-SPEZIFIKATION.md §9.
  return block.solutions.every((sol, i) => {
    const given = answer[i] ?? '';
    if (block.strict) {
      return normalize(sol) === normalize(given);
    }
    return isFuzzyMatch(given, sol);
  });
}

function evalMatch(block: MatchBlock, answer: MatchAnswer): boolean {
  return block.pairs.every((pair) => answer[pair.id] === pair.category);
}

// Teilpunkte: Anteil korrekt einsortierter Items (0.0–1.0). Ein leeres Modul
// (keine Items) wäre durch das Schema-min(2) ausgeschlossen, defensiv → 0.
function evalCategorize(block: CategorizeBlock, answer: CategorizeAnswer): number {
  if (block.items.length === 0) return 0;
  const correct = block.items.filter((item) => answer[item.id] === item.bucketId).length;
  return correct / block.items.length;
}

// Markieren-im-Text: Anteil korrekt markierter Wörter, abzüglich Falschmarkierungen.
// Score = (richtig markiert − falsch markiert) / Anzahl-richtige, geclampt auf [0,1].
// So lohnt sich „alles markieren" nicht (jede Falschmarkierung kostet einen Punkt).
function evalMarkWords(block: MarkWordsBlock, answer: MarkWordsAnswer): number {
  const correctSet = new Set(block.correctIndices);
  if (correctSet.size === 0) return 0;
  const marked = new Set(answer);
  let hits = 0;
  let misses = 0; // markiert, aber falsch
  for (const idx of marked) {
    if (correctSet.has(idx)) hits += 1;
    else misses += 1;
  }
  return (hits - misses) / correctSet.size;
}

// Reihenfolge: Anteil korrekter Nachbarpaare. block.items ist die KORREKTE
// Reihenfolge; answer ist die Schüler:innen-Reihenfolge (itemIds). Bei N Items
// gibt es N-1 Nachbarpaare in der Lösung — der Score ist der Anteil dieser
// Paare, die in der Antwort direkt hintereinander + in der richtigen Richtung
// stehen. Fairer als reine Positionsgleichheit (ein früher Fehler verschiebt
// nicht alle Folgepositionen). Antwort muss vollständig sein (alle Items),
// sonst zählen fehlende Paare als falsch.
function evalOrder(block: OrderBlock, answer: OrderAnswer): number {
  const n = block.items.length;
  if (n < 2) return 0;
  // Position jedes Items in der Schüler:innen-Antwort.
  const pos = new Map<string, number>();
  answer.forEach((id, i) => pos.set(id, i));
  let correctPairs = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = block.items[i]!.id;
    const b = block.items[i + 1]!.id;
    const pa = pos.get(a);
    const pb = pos.get(b);
    // Paar zählt, wenn beide vorhanden sind UND b direkt nach a steht.
    if (pa !== undefined && pb !== undefined && pb === pa + 1) correctPairs += 1;
  }
  return correctPairs / (n - 1);
}

// Bild-Hotspots: Anteil korrekt angetippter Zonen minus Falschklicks.
// Score = (richtig angetippt − falsch angetippt) / Anzahl-richtige, geclampt
// auf [0,1] (durch gradeBlock). „Alle Zonen antippen" lohnt nicht.
function evalHotspot(block: HotspotBlock, answer: HotspotAnswer): number {
  const correctIds = new Set(block.areas.filter((a) => a.isCorrect).map((a) => a.id));
  if (correctIds.size === 0) return 0;
  const picked = new Set(answer);
  let hits = 0;
  let misses = 0;
  for (const id of picked) {
    if (correctIds.has(id)) hits += 1;
    else misses += 1;
  }
  return (hits - misses) / correctIds.size;
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
// BINÄRE Blöcke (alles oder nichts) gehören hierher.
const CHECKERS: Record<string, (block: Block, answer: BlockAnswer | undefined) => boolean> = {
  multiple_choice: (b, a) =>
    evalMultipleChoice(b as MultipleChoiceBlock, (a as MultipleChoiceAnswer) ?? []),
  true_false: (b, a) => a === (b as TrueFalseBlock).answer,
  fill_blank: (b, a) => evalFillBlank(b as FillBlankBlock, (a as FillBlankAnswer) ?? []),
  match: (b, a) => evalMatch(b as MatchBlock, (a as MatchAnswer) ?? {}),
};

// Phase-Lernformen-2.0: TEILPUNKTE-Prüfer geben direkt 0.0–1.0 zurück (z.B.
// „3 von 4 Zuordnungen" = 0.75). Hat Vorrang vor CHECKERS — ein Block-Typ
// steht entweder hier ODER in CHECKERS, nie in beiden. Neue Aufgabentypen
// mit Teilpunkten (categorize, order, mark_words, hotspot) registrieren sich
// HIER. Voraussetzung: numeric-Persistenz (Migration 0024).
const PARTIAL_GRADERS: Record<string, (block: Block, answer: BlockAnswer | undefined) => number> = {
  categorize: (b, a) => evalCategorize(b as CategorizeBlock, (a as CategorizeAnswer) ?? {}),
  mark_words: (b, a) => evalMarkWords(b as MarkWordsBlock, (a as MarkWordsAnswer) ?? []),
  order: (b, a) => evalOrder(b as OrderBlock, (a as OrderAnswer) ?? []),
  hotspot: (b, a) => evalHotspot(b as HotspotBlock, (a as HotspotAnswer) ?? []),
};

export function gradeBlock(block: Block, answer: BlockAnswer | undefined): number {
  const partial = PARTIAL_GRADERS[block.type];
  if (partial) {
    // Defensiv auf [0,1] clampen — kein Prüfer darf außerhalb liefern.
    return Math.max(0, Math.min(1, partial(block, answer)));
  }
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

// Punkte = Summe der Teilergebnisse über alle bewertbaren Blöcke. Mit
// Teilpunkte-Blöcken kann das Brüche enthalten (z.B. 7.5) — die
// student_progress.score-Spalte ist seit Migration 0024 numeric(6,2).
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
// 'partial' (Teilpunkte) für Aufgabentypen, die einen Bruchwert liefern können
// (categorize, order, mark_words, hotspot) — z.B. „3 von 4 richtig".
export type BlockResult = 'correct' | 'partial' | 'wrong' | 'ungraded';

export function blockResult(block: Block, answer: BlockAnswer | undefined): BlockResult {
  if (!isGraded(block)) {
    return 'ungraded';
  }
  const score = gradeBlock(block, answer);
  if (score >= 1) return 'correct';
  if (score <= 0) return 'wrong';
  return 'partial';
}

// Roher Score eines Blocks als 0.0–1.0 — für die Teilpunkte-Anzeige in der
// Lehrer:innen-Korrektur (z.B. „75 %" oder „3 von 4"). Nicht-bewertbare
// Blöcke liefern null (Anteil nicht anwendbar).
export function blockScore(block: Block, answer: BlockAnswer | undefined): number | null {
  if (!isGraded(block)) return null;
  return gradeBlock(block, answer);
}
