import { z } from 'zod';

// Block-Schemas für die Modul-Engine (PLATTFORM_MANIFEST §4, Phase 1).
// Zod ist die Single Source of Truth; die TS-Typen werden abgeleitet.
// Geteilt zwischen Frontend (BlockRenderer) und Backend (Modul-Validierung).

const blockId = z.string().min(1);

// Phase W (2026-06): Didaktische Kategorisierung für die BlockList-
// Gruppierung im Editor. Optional, damit Bestands-Blöcke gültig bleiben.
// 'theorie' = vermittelt, 'uebung' = trainiert, 'reflexion' = lässt
// nachdenken. Default-Anzeige in der UI: keine Sektion = „Sonstiges".
export const BLOCK_CATEGORIES = ['theorie', 'uebung', 'reflexion'] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];
const blockCategorySchema = z.enum(BLOCK_CATEGORIES);

// Phase W: Felder für bewertbare Blöcke (MC, T/F, Lückentext, Match).
// `hint` erscheint nach dem 1. Fehlversuch in einer HintBox unter dem
// Block. `maxAttempts` legt fest, wie oft Schüler:in es probieren darf;
// undefined = altes Verhalten (1 Versuch). Pro Versuch -25 % Punkte.
const gradedBlockExtensions = {
  hint: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(5).optional(),
  category: blockCategorySchema.optional(),
};

// Für Theorie-/Live-Blöcke nur die category-Erweiterung.
const taxonomyExtension = {
  category: blockCategorySchema.optional(),
};

export const textBlockSchema = z.object({
  id: blockId,
  type: z.literal('text'),
  content: z.string(),
  imageUrl: z.string().url().optional(),
  ...taxonomyExtension,
});

export const infoboxBlockSchema = z.object({
  id: blockId,
  type: z.literal('infobox'),
  title: z.string().optional(),
  content: z.string(),
  ...taxonomyExtension,
});

const choiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  correct: z.boolean(),
});

export const multipleChoiceBlockSchema = z.object({
  id: blockId,
  type: z.literal('multiple_choice'),
  question: z.string(),
  options: z.array(choiceOptionSchema).min(2),
  feedbackCorrect: z.string().optional(),
  feedbackWrong: z.string().optional(),
  ...gradedBlockExtensions,
});

export const trueFalseBlockSchema = z.object({
  id: blockId,
  type: z.literal('true_false'),
  question: z.string(),
  answer: z.boolean(),
  feedbackCorrect: z.string().optional(),
  feedbackWrong: z.string().optional(),
  ...gradedBlockExtensions,
});

export const fillBlankBlockSchema = z.object({
  id: blockId,
  type: z.literal('fill_blank'),
  // Text mit Platzhaltern, z.B. "Ein {0} ist ein Eingabegerät."
  text: z.string(),
  // Lösungswörter in Reihenfolge der Platzhalter.
  solutions: z.array(z.string()).min(1),
  // Zusätzliche Distraktoren für den Wortpool.
  distractors: z.array(z.string()).default([]),
  // Tippfehlertoleranz: per Default werden Einzelbuchstaben-Vertipper bei
  // Wörtern ≥ 4 Buchstaben akzeptiert (Levenshtein ≤ 1). `strict: true`
  // schaltet das aus — sinnvoll für Fachbegriffe, deren Schreibweise exakt
  // zählen muss (z. B. chemische Formeln, Eigennamen). Siehe
  // docs/QUIZ-MODI-SPEZIFIKATION.md §9.
  // Optional, weil falsy === aus (default-Verhalten).
  strict: z.boolean().optional(),
  ...gradedBlockExtensions,
});

const matchPairSchema = z.object({
  id: z.string().min(1),
  term: z.string(),
  category: z.string(),
});

export const matchBlockSchema = z.object({
  id: blockId,
  type: z.literal('match'),
  question: z.string().optional(),
  pairs: z.array(matchPairSchema).min(2),
  ...gradedBlockExtensions,
});

// Kategorisieren (Bucket-Sort): Items in benannte Behälter einsortieren.
// Anders als `match` sind Behälter EIGENE Objekte mit id+label (nicht im Item
// inline) — das erlaubt mehrere Items pro Behälter sauber + Teilpunkte
// (Anteil korrekt einsortierter Items). bucketId jedes Items zeigt auf die
// korrekte Lösung.
const categorizeBucketSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
});
const categorizeItemSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  bucketId: z.string().min(1), // korrekter Behälter (Lösung)
});

export const categorizeBlockSchema = z.object({
  id: blockId,
  type: z.literal('categorize'),
  question: z.string().optional(),
  buckets: z.array(categorizeBucketSchema).min(2).max(4),
  items: z.array(categorizeItemSchema).min(2),
  ...gradedBlockExtensions,
});

// Markieren-im-Text: Schüler:in tippt im Text die Wörter an, die zu einem
// Kriterium passen (z.B. „markiere alle persönlichen Daten"). `text` wird per
// lib/blocks/tokenize.ts in Wort-Tokens zerlegt; `correctIndices` referenziert
// die 0-basierten wordIndex der richtigen Wörter. Antwort = number[]. Teilpunkte.
export const markWordsBlockSchema = z.object({
  id: blockId,
  type: z.literal('mark_words'),
  // Aufgabenstellung („Markiere alle …").
  instruction: z.string(),
  // Der zu markierende Fließtext.
  text: z.string().min(1),
  // 0-basierte wordIndex der richtig zu markierenden Wörter (≥ 1).
  correctIndices: z.array(z.number().int().min(0)).min(1),
  ...gradedBlockExtensions,
});

// Reihenfolge: Schüler:in bringt Items in die richtige Reihenfolge. `items`
// sind in der KORREKTEN Reihenfolge angegeben (so wie der/die Autor:in sie
// eingibt). Im Renderer werden sie gemischt angezeigt. Antwort = string[] der
// itemIds in gewählter Reihenfolge. Teilpunkte via Anteil korrekter
// Nachbarpaare (fairer als Positionsgleichheit — ein früher Fehler ruiniert
// nicht alles).
const orderItemSchema = z.object({ id: z.string().min(1), text: z.string() });
export const orderBlockSchema = z.object({
  id: blockId,
  type: z.literal('order'),
  instruction: z.string(),
  items: z.array(orderItemSchema).min(2),
  ...gradedBlockExtensions,
});

export const reflectionBlockSchema = z.object({
  id: blockId,
  type: z.literal('reflection'),
  prompt: z.string(),
  placeholder: z.string().optional(),
  ...taxonomyExtension,
});

// Präsentationsfolie für den geführten Stundeneinstieg (display_mode
// 'presentation'). Wird groß am Beamer gezeigt, nicht auto-bewertet.
export const slideBlockSchema = z.object({
  id: blockId,
  type: z.literal('slide'),
  title: z.string(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// Live-Abstimmung während einer Präsentation. Anders als multiple_choice gibt es
// KEIN `correct` — es ist ein unbenotetes Meinungsbild. Stimmen in live_votes.
const pollOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
});

export const livePollBlockSchema = z.object({
  id: blockId,
  type: z.literal('live_poll'),
  question: z.string(),
  options: z.array(pollOptionSchema).min(2),
});

// Quiz-Poll: wie live_poll, aber mit `correct`-Flag pro Option. Das Flag wird
// NIEMALS an Schüler:innen-Geräte gesendet — nur der Beamer löst auf.
const quizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  correct: z.boolean(),
});

export const quizPollBlockSchema = z.object({
  id: blockId,
  type: z.literal('quiz_poll'),
  question: z.string(),
  options: z.array(quizOptionSchema).min(2),
});

// Wortwolke: Schüler:innen tippen Freitext (max 40 Zeichen). Beamer zeigt
// häufige Wörter größer. Stimmen in live_votes.free_text (option_id null).
export const wordCloudBlockSchema = z.object({
  id: blockId,
  type: z.literal('word_cloud'),
  question: z.string(),
});

// Skala 1–5: Schüler:innen klicken einen Wert. Beamer zeigt Durchschnitt + Balken.
export const scaleBlockSchema = z.object({
  id: blockId,
  type: z.literal('scale'),
  question: z.string(),
  min: z.number().int().default(1),
  max: z.number().int().default(5),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

// Verständnis-Ampel (als eigene Folie): 3 feste Optionen grün/gelb/rot.
// Keine freien Optionen — das ist kein Poll, sondern ein Signal.
export const understandingBlockSchema = z.object({
  id: blockId,
  type: z.literal('understanding'),
  question: z.string().optional(),
});

export const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  infoboxBlockSchema,
  multipleChoiceBlockSchema,
  trueFalseBlockSchema,
  fillBlankBlockSchema,
  matchBlockSchema,
  categorizeBlockSchema,
  markWordsBlockSchema,
  orderBlockSchema,
  reflectionBlockSchema,
  slideBlockSchema,
  livePollBlockSchema,
  quizPollBlockSchema,
  wordCloudBlockSchema,
  scaleBlockSchema,
  understandingBlockSchema,
]);

export const moduleContentSchema = z.object({
  blocks: z.array(blockSchema),
});

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];
export type ModuleContent = z.infer<typeof moduleContentSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type MultipleChoiceBlock = z.infer<typeof multipleChoiceBlockSchema>;
export type TrueFalseBlock = z.infer<typeof trueFalseBlockSchema>;
export type FillBlankBlock = z.infer<typeof fillBlankBlockSchema>;
export type MatchBlock = z.infer<typeof matchBlockSchema>;
export type CategorizeBlock = z.infer<typeof categorizeBlockSchema>;
export type MarkWordsBlock = z.infer<typeof markWordsBlockSchema>;
export type OrderBlock = z.infer<typeof orderBlockSchema>;
export type ReflectionBlock = z.infer<typeof reflectionBlockSchema>;
export type InfoboxBlock = z.infer<typeof infoboxBlockSchema>;
export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type LivePollBlock = z.infer<typeof livePollBlockSchema>;
export type QuizPollBlock = z.infer<typeof quizPollBlockSchema>;
export type WordCloudBlock = z.infer<typeof wordCloudBlockSchema>;
export type ScaleBlock = z.infer<typeof scaleBlockSchema>;
export type UnderstandingBlock = z.infer<typeof understandingBlockSchema>;
