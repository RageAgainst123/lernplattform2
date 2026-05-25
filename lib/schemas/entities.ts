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
});

// --- modules ---------------------------------------------------------------
export const moduleInsertSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  schulstufe: schulstufeSchema.optional(),
  kompetenzbereich: kompetenzbereichSchema.optional(),
  topic: z.string().optional(),
  content: moduleContentSchema,
  estimatedMinutes: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
});

export const moduleSchema = moduleInsertSchema.extend({
  id: z.uuid(),
  createdBy: z.uuid().nullable(),
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
export type Material = z.infer<typeof materialSchema>;
