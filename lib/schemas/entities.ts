import { z } from 'zod';
import { moduleContentSchema } from '@/lib/schemas/blocks';

// Entitäts-Schemas (PLATTFORM_MANIFEST §3). Geteilt zwischen Frontend-Forms
// und Backend-Validierung. Spiegeln die DB-Tabellen wider.

export const schulstufeSchema = z.number().int().min(1).max(9);

export const kompetenzbereichSchema = z.enum([
  'orientierung',
  'information',
  'kommunikation',
  'produktion',
  'handeln',
]);

export const materialTypeSchema = z.enum(['theorie', 'arbeitsblatt', 'loesung', 'stundenbild']);

// --- classes ---------------------------------------------------------------
export const classInsertSchema = z.object({
  name: z.string().min(1).max(120),
  schulstufe: schulstufeSchema.optional(),
});

export const classSchema = classInsertSchema.extend({
  id: z.uuid(),
  teacherId: z.uuid(),
  joinCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- student_codes ---------------------------------------------------------
// codename ohne Personenbezug (DSGVO). PIN wird vor dem Speichern gehasht —
// das Schema validiert die rohe 4-stellige Eingabe.
export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN muss vierstellig sein');

export const studentCodeSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  codename: z.string().min(1),
  createdAt: z.string(),
  lastActiveAt: z.string().nullable(),
  // Phase O: O365-SSO-Felder. NULL bei Code+PIN-Schüler:innen.
  givenName: z.string().nullable().optional(),
  surname: z.string().nullable().optional(),
  o365Email: z.string().nullable().optional(),
});

// --- topics ----------------------------------------------------------------
// Phase G: Themen sind eigene Entitäten (vorher nur loser topic-String).
// Ein Thema bündelt mehrere Bausteine (Lernmodule, Präsentationen, Quiz,
// Abschlusstest) in einer Reihenfolge zu einem Lernpfad.
export const topicInsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche.'),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  schulstufe: schulstufeSchema.optional(),
  kompetenzbereich: kompetenzbereichSchema.optional(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const topicSchema = topicInsertSchema.extend({
  id: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- modules ---------------------------------------------------------------
// activityKind ist der primäre Diskriminator. Phase G erweitert die Union
// um 'quiz' (Kahoot-Style Live-Quiz, später) und 'abschlusstest' (Test mit
// Voraussetzungen). 'lernmodul' und 'praesentation' aus Phase E bleiben.
export const activityKindSchema = z.enum(['lernmodul', 'praesentation', 'quiz', 'abschlusstest']);

// Display-Sub-Variante NUR für Lernmodule. Quiz: Block-für-Block mit Sofort-
// Feedback. Worksheet: alle Aufgaben auf einer Seite, Abgabe am Ende.
// 'presentation' bleibt in der Union nur aus Rückwärtskompatibilität — neue
// Module sollten ihn nicht mehr setzen (activityKind='praesentation' reicht).
export const displayModeSchema = z.enum(['quiz', 'worksheet', 'presentation']);

export const moduleInsertSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  schulstufe: schulstufeSchema.optional(),
  kompetenzbereich: kompetenzbereichSchema.optional(),
  topic: z.string().optional(),
  topicId: z.uuid().nullable().optional(),
  sortOrder: z.number().int().default(0),
  content: moduleContentSchema,
  estimatedMinutes: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
  activityKind: activityKindSchema.default('lernmodul'),
  displayMode: displayModeSchema.default('quiz'),
});

export const moduleSchema = moduleInsertSchema.extend({
  id: z.uuid(),
  createdBy: z.uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- portfolio_entries (Phase H1: Schulheft) --------------------------------
// Tiptap-Doc als JSON. Wir validieren nur die äußere Hülle — die Block-
// Struktur intern ist ProseMirror-Standard und wird vom Editor beim Render
// validiert. content_json bleibt ein z.record für Flexibilität (neue Tiptap-
// Extensions sollen kein Schema-Update auslösen).
export const portfolioEntryInsertSchema = z.object({
  topicId: z.uuid().nullable().optional(),
  title: z.string().max(200).optional(),
  contentJson: z.record(z.string(), z.unknown()).default({}),
});

export const portfolioEntrySchema = portfolioEntryInsertSchema.extend({
  id: z.uuid(),
  studentCodeId: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- materials -------------------------------------------------------------
export const materialSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  schulstufe: schulstufeSchema.nullable(),
  topic: z.string().nullable(),
  materialType: materialTypeSchema,
  filePath: z.string().min(1),
  isTeacherOnly: z.boolean(),
  createdAt: z.string(),
});

export type Schulstufe = z.infer<typeof schulstufeSchema>;
export type Kompetenzbereich = z.infer<typeof kompetenzbereichSchema>;
export type MaterialType = z.infer<typeof materialTypeSchema>;
export type ClassInsert = z.infer<typeof classInsertSchema>;
export type Class = z.infer<typeof classSchema>;
export type StudentCode = z.infer<typeof studentCodeSchema>;
export type ModuleInsert = z.infer<typeof moduleInsertSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type ActivityKind = z.infer<typeof activityKindSchema>;
export type DisplayMode = z.infer<typeof displayModeSchema>;
export type TopicInsert = z.infer<typeof topicInsertSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Material = z.infer<typeof materialSchema>;
export type PortfolioEntryInsert = z.infer<typeof portfolioEntryInsertSchema>;
export type PortfolioEntry = z.infer<typeof portfolioEntrySchema>;

// --- word_heft_links (Phase Q: OneDrive-Sharing-Link) ---------------------
// O365-Schüler:innen verlinken ihr Word-Heft im eigenen OneDrive. Wir
// speichern NUR die URL, keine Datei-Inhalte. Siehe ADR-0015.
export const validationStatusSchema = z.enum(['pending', 'ok', 'broken', 'unverified']);

export const wordHeftLinkInsertSchema = z.object({
  topicId: z.uuid().nullable().optional(),
  oneDriveUrl: z.string().min(1).max(2000),
  displayName: z.string().max(200).optional().nullable(),
});

export const wordHeftLinkSchema = wordHeftLinkInsertSchema.extend({
  id: z.uuid(),
  studentCodeId: z.uuid(),
  validationStatus: validationStatusSchema,
  lastValidatedAt: z.string().nullable(),
  lastOpenedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ValidationStatus = z.infer<typeof validationStatusSchema>;
export type WordHeftLinkInsert = z.infer<typeof wordHeftLinkInsertSchema>;
export type WordHeftLink = z.infer<typeof wordHeftLinkSchema>;
