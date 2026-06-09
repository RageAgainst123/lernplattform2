import { z } from 'zod';
import {
  slideBlockSchema,
  livePollBlockSchema,
  quizPollBlockSchema,
  wordCloudBlockSchema,
  scaleBlockSchema,
  understandingBlockSchema,
} from './blocks-live.ts';
import { hotspotAreaSchema, hotspotGroupSchema } from './blocks-hotspot.ts';
import { labelImageBlockSchema } from './blocks-label-image.ts';
import {
  blockId,
  gradedBlockExtensions,
  taxonomyExtension,
  BLOCK_CATEGORIES,
} from './blocks-shared.ts';
import type { BlockCategory } from './blocks-shared.ts';

export { HOTSPOT_SHAPES } from './blocks-hotspot.ts';
export { labelImageBlockSchema };
export { BLOCK_CATEGORIES };
export type { BlockCategory };
export type { HotspotShape } from './blocks-hotspot.ts';

export {
  slideBlockSchema,
  livePollBlockSchema,
  quizPollBlockSchema,
  wordCloudBlockSchema,
  scaleBlockSchema,
  understandingBlockSchema,
} from './blocks-live.ts';
export type {
  SlideBlock,
  LivePollBlock,
  QuizPollBlock,
  WordCloudBlock,
  ScaleBlock,
  UnderstandingBlock,
} from './blocks-live.ts';

// Block-Schemas für die Modul-Engine (PLATTFORM_MANIFEST §4, Phase 1).
// Zod ist die Single Source of Truth; die TS-Typen werden abgeleitet.
// Geteilt zwischen Frontend (BlockRenderer) und Backend (Modul-Validierung).
// Geteilte Bausteine (blockId, BLOCK_CATEGORIES, gradedBlockExtensions,
// taxonomyExtension) leben in blocks-shared.ts (kein Zirkel-Import mit
// typ-spezifischen Dateien wie blocks-label-image.ts).

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

// Bild-Hotspots: sichtbare Zonen auf einem Bild, manche sind richtig. Schüler:in
// tippt die richtigen an. Teilpunkte (richtig − falsch) / Anzahl-richtige.
// Zonen-Schema (Kreis/Rechteck, Rotation) lebt in blocks-hotspot.ts.
export const hotspotBlockSchema = z.object({
  id: blockId,
  type: z.literal('hotspot'),
  instruction: z.string(),
  imageUrl: z.string().url(),
  imageAlt: z.string().optional(),
  // Optional: Gruppen-Modus. Ohne groups = eine Frage (Einfach-Modus).
  groups: z.array(hotspotGroupSchema).max(6).optional(),
  // Darf beim frisch erstellten Block leer sein (der/die Admin zeichnet die
  // Zonen selbst). Dass ein FERTIGER Block mindestens eine richtige Zone hat,
  // prüft scripts/validate-module.mjs — nicht das Struktur-Schema.
  areas: z.array(hotspotAreaSchema).max(20),
  // true (Default, Bestandsverhalten) = Zonen-Rahmen sind für Schüler:innen
  // sichtbar und anklickbar. false = Rahmen versteckt → Schüler:in klickt frei
  // aufs Bild („Finde das Objekt"). Im versteckten Modus gibt es KEIN Live-
  // Feedback pro Klick (neutrale Marker), erst beim Prüfen wird aufgelöst — so
  // wird Herumraten verhindert.
  revealZones: z.boolean().default(true),
  // Optional (nur versteckter Modus): begrenzt die Anzahl Klicks. undefined =
  // unbegrenzt. Sinnvoll = Anzahl der richtigen Zonen, dann ist Raten teuer.
  maxClicks: z.number().int().min(1).max(20).optional(),
  // true = Bild kann gezoomt/verschoben werden (Buttons +/−, Pan via Scrollen).
  // Für detailreiche Bilder. Default false = Bestandsverhalten.
  zoomable: z.boolean().default(false),
  ...gradedBlockExtensions,
});

// Bild-Beschriften: Stellen im Bild den richtigen Begriffen zuordnen. Schema +
// Doku in blocks-label-image.ts (eigene Datei, vermeidet Zirkel-Import).
// Importiert + re-exportiert oben.

export const reflectionBlockSchema = z.object({
  id: blockId,
  type: z.literal('reflection'),
  prompt: z.string(),
  placeholder: z.string().optional(),
  ...taxonomyExtension,
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
  hotspotBlockSchema,
  labelImageBlockSchema,
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
export type HotspotBlock = z.infer<typeof hotspotBlockSchema>;
export type LabelImageBlock = z.infer<typeof labelImageBlockSchema>;
export type ReflectionBlock = z.infer<typeof reflectionBlockSchema>;
export type InfoboxBlock = z.infer<typeof infoboxBlockSchema>;
