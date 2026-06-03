import { z } from 'zod';

// Block-Schemas für die Modul-Engine (PLATTFORM_MANIFEST §4, Phase 1).
// Zod ist die Single Source of Truth; die TS-Typen werden abgeleitet.
// Geteilt zwischen Frontend (BlockRenderer) und Backend (Modul-Validierung).

const blockId = z.string().min(1);

export const textBlockSchema = z.object({
  id: blockId,
  type: z.literal('text'),
  content: z.string(),
  imageUrl: z.string().url().optional(),
});

export const infoboxBlockSchema = z.object({
  id: blockId,
  type: z.literal('infobox'),
  title: z.string().optional(),
  content: z.string(),
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
});

export const trueFalseBlockSchema = z.object({
  id: blockId,
  type: z.literal('true_false'),
  question: z.string(),
  answer: z.boolean(),
  feedbackCorrect: z.string().optional(),
  feedbackWrong: z.string().optional(),
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
});

export const reflectionBlockSchema = z.object({
  id: blockId,
  type: z.literal('reflection'),
  prompt: z.string(),
  placeholder: z.string().optional(),
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
export type ReflectionBlock = z.infer<typeof reflectionBlockSchema>;
export type InfoboxBlock = z.infer<typeof infoboxBlockSchema>;
export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type LivePollBlock = z.infer<typeof livePollBlockSchema>;
export type QuizPollBlock = z.infer<typeof quizPollBlockSchema>;
export type WordCloudBlock = z.infer<typeof wordCloudBlockSchema>;
export type ScaleBlock = z.infer<typeof scaleBlockSchema>;
export type UnderstandingBlock = z.infer<typeof understandingBlockSchema>;
