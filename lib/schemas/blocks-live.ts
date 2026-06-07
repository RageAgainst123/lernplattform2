import { z } from 'zod';

// Live-/Präsentations-Block-Schemas (display_mode 'presentation' +
// Beamer-Interaktion). Ausgelagert aus blocks.ts, damit beide Dateien unter
// der Zeilen-Grenze bleiben. Werden in blocks.ts re-exportiert und in die
// discriminatedUnion aufgenommen.

const blockId = z.string().min(1);

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

export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type LivePollBlock = z.infer<typeof livePollBlockSchema>;
export type QuizPollBlock = z.infer<typeof quizPollBlockSchema>;
export type WordCloudBlock = z.infer<typeof wordCloudBlockSchema>;
export type ScaleBlock = z.infer<typeof scaleBlockSchema>;
export type UnderstandingBlock = z.infer<typeof understandingBlockSchema>;
