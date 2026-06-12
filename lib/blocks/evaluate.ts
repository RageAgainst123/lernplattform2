// prettier-ignore
import type {
  Block, CategorizeBlock, CrosswordBlock, FillBlankBlock, HangmanBlock, HotspotBlock,
  LabelImageBlock, MarkWordsBlock, MemoryBlock, MatchBlock, MultipleChoiceBlock, OrderBlock,
  ScrambleBlock, TrueFalseBlock, WordSearchBlock,
} from '@/lib/schemas/blocks';
import { isFuzzyMatch } from '@/lib/blocks/levenshtein';
import { gradeCrosswordCells } from '@/lib/blocks/crossword-grid';
import { gradeScrambleWords } from '@/lib/blocks/scramble';

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
export type LabelImageAnswer = Record<string, string>; // zoneId → gewählter Begriff
export type MemoryAnswer = string[]; // erfolgreich gematchte pairIds
export type CrosswordAnswer = Record<string, string>; // "r,c" → eingegebener Buchstabe
export type WordSearchAnswer = string[]; // gefundene wordIds
export type ScrambleAnswer = Record<string, string>; // wordId → gebautes Wort
export type HangmanAnswer = string[]; // gelöste wordIds
// prettier-ignore
export type BlockAnswer =
  | MultipleChoiceAnswer | TrueFalseAnswer | FillBlankAnswer | MatchAnswer | CategorizeAnswer
  | MarkWordsAnswer | OrderAnswer | HotspotAnswer | LabelImageAnswer | MemoryAnswer
  | CrosswordAnswer | WordSearchAnswer | ScrambleAnswer | HangmanAnswer | string;

// Block-Typen ohne automatische Bewertung (reiner Inhalt, freie Antwort,
// Präsentationsfolie oder unbenotete Live-Interaktion).
// prettier-ignore
const NON_GRADED = new Set([
  'text', 'infobox', 'reflection', 'slide', 'live_poll', 'quiz_poll', 'word_cloud', 'scale',
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

// Score für eine Zonen-Teilmenge: (richtig angetippt − falsch angetippt) /
// Anzahl-richtige. Nur Zonen aus `areas` zählen; alles andere in `picked` wird
// ignoriert. „Alle Zonen antippen" lohnt nicht (jeder Falschklick zieht ab).
function scoreAreaSet(areas: HotspotBlock['areas'], picked: Set<string>): number {
  const correctIds = new Set(areas.filter((a) => a.isCorrect).map((a) => a.id));
  if (correctIds.size === 0) return 0;
  let hits = 0;
  let misses = 0;
  for (const a of areas) {
    if (!picked.has(a.id)) continue;
    if (correctIds.has(a.id)) hits += 1;
    else misses += 1;
  }
  return (hits - misses) / correctIds.size;
}

// Bild-Hotspots: Anteil korrekt angetippter Zonen minus Falschklicks. Geclampt
// auf [0,1] (durch gradeBlock).
//
// Einfach-Modus (keine groups): über alle Zonen.
// Gruppen-Modus: pro Gruppe (eigene Zonen + gruppenlose Distraktoren) scoren,
// dann ungewichteter Durchschnitt. Gruppenzugehörigkeit steckt in area.groupId
// — die Antwort bleibt ein flaches string[] der angetippten areaIds.
function evalHotspot(block: HotspotBlock, answer: HotspotAnswer): number {
  const picked = new Set(answer);
  const groups = block.groups ?? [];
  if (groups.length === 0) return scoreAreaSet(block.areas, picked);

  const distractors = block.areas.filter((a) => a.groupId === undefined && !a.isCorrect);
  const perGroup = groups.map((g) => {
    const inGroup = block.areas.filter((a) => a.groupId === g.id);
    return Math.max(0, scoreAreaSet([...inGroup, ...distractors], picked));
  });
  if (perGroup.length === 0) return 0;
  return perGroup.reduce((sum, v) => sum + v, 0) / perGroup.length;
}

// Bild-Beschriften: Schüler:in ordnet jeder Zone einen Begriff zu (answer =
// zoneId → gewählter Begriff). Teilpunkte = korrekt zugeordnete / Anzahl Zonen.
function evalLabelImage(block: LabelImageBlock, answer: LabelImageAnswer): number {
  if (block.zones.length === 0) return 0;
  const correct = block.zones.filter((z) => answer[z.id] === z.label).length;
  return correct / block.zones.length;
}

// Anteil gefundener Einträge an einer ID-Liste — geteilt von memory (gefundene
// Paare / alle Paare) und word_search (gefundene Wörter / alle Wörter).
// Fremd-/Doppel-IDs werden ignoriert (Set-Dedup + Filter gegen die echten IDs)
// — robust gegen manipulierte Antworten.
function foundRatio(items: { id: string }[], answer: string[]): number {
  if (items.length === 0) return 0;
  const valid = new Set(items.map((it) => it.id));
  return new Set(answer.filter((id) => valid.has(id))).size / items.length;
}

// Erweiterbarkeit — neuen Block-Typ ins Scoring aufnehmen: (1) Schema + Antwort-
// Format in blocks.ts, (2) Eintrag in CHECKERS (binär) ODER PARTIAL_GRADERS
// (Teilpunkte), (3) Renderer. Die Pipeline (scoreModule/maxScore/percentScore/
// isPassed/Matrix) läuft danach unverändert über gradeBlock() + isGraded().
//
// CHECKERS: binäre Prüfer (alles oder nichts), boolean. Genau ein Eintrag pro Typ.
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
  label_image: (b, a) => evalLabelImage(b as LabelImageBlock, (a as LabelImageAnswer) ?? {}),
  memory: (b, a) => foundRatio((b as MemoryBlock).pairs, (a as MemoryAnswer) ?? []),
  // Zell-Logik + Formel leben in crossword-grid.ts (geteilt mit Renderer/Editor).
  crossword: (b, a) => gradeCrosswordCells(b as CrosswordBlock, (a as CrosswordAnswer) ?? {}),
  word_search: (b, a) => foundRatio((b as WordSearchBlock).words, (a as WordSearchAnswer) ?? []),
  // Wort-Vergleich lebt in scramble.ts (geteilt mit Renderer/Editor-Vorschau).
  scramble: (b, a) => gradeScrambleWords(b as ScrambleBlock, (a as ScrambleAnswer) ?? {}),
  hangman: (b, a) => foundRatio((b as HangmanBlock).words, (a as HangmanAnswer) ?? []),
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
