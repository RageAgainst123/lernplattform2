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
// KEIN `correct` — es ist ein unbenotetes Meinungsbild (Stimmungsabfrage,
// Diskussionsanlass). Nicht auto-bewertet. Die Stimmen leben in der Tabelle
// live_votes, nicht in student_progress.
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
