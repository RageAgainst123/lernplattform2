'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  schulstufeSchema,
  kompetenzbereichSchema,
  materialTypeSchema,
} from '@/lib/schemas/entities';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createServiceClient } from '@/lib/supabase/admin';

// Server Actions für Material-CRUD + PDF-Upload zu Supabase Storage.
// Alle Aktionen verlangen Admin-Rechte und nutzen den Service-Role-Client.

const STORAGE_BUCKET = 'materials';

const materialInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  schulstufe: schulstufeSchema.optional(),
  kompetenzbereich: kompetenzbereichSchema.optional(),
  topic: z.string().optional(),
  materialType: materialTypeSchema,
  isTeacherOnly: z.boolean().default(false),
  relatedModuleId: z.uuid().nullish(),
});

export type MaterialInput = z.infer<typeof materialInputSchema>;

function rowFromInput(input: MaterialInput, filePath: string) {
  return {
    title: input.title,
    description: input.description ?? null,
    schulstufe: input.schulstufe ?? null,
    kompetenzbereich: input.kompetenzbereich ?? null,
    topic: input.topic ?? null,
    material_type: input.materialType,
    file_path: filePath,
    is_teacher_only: input.isTeacherOnly,
    related_module_id: input.relatedModuleId ?? null,
  };
}

// Lädt ein PDF in den materials-Bucket. Gibt den path zurück (relativ zum Bucket).
async function uploadPdf(file: File, slug: string): Promise<string> {
  const svc = createServiceClient();
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
  const path = `${safeSlug}/${Date.now()}-${file.name}`;
  const { error } = await svc.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || 'application/pdf',
    upsert: false,
  });
  if (error) throw new Error('PDF-Upload fehlgeschlagen: ' + error.message);
  return path;
}

// Neues Material anlegen: Datei-Upload + DB-Insert in einem Schritt.
export async function createMaterial(input: unknown, file: File): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = materialInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  if (file.size === 0) throw new Error('Bitte eine PDF-Datei auswählen.');
  const slug = parsed.data.topic ?? parsed.data.title;
  const filePath = await uploadPdf(file, slug);
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('materials')
    .insert(rowFromInput(parsed.data, filePath))
    .select('id')
    .single();
  if (error) throw new Error('Material konnte nicht angelegt werden: ' + error.message);
  revalidatePath('/admin/material');
  return { id: data.id as string };
}

// Material-Metadaten aktualisieren (ohne File-Tausch).
export async function updateMaterialMeta(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const parsed = materialInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('materials')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      schulstufe: parsed.data.schulstufe ?? null,
      kompetenzbereich: parsed.data.kompetenzbereich ?? null,
      topic: parsed.data.topic ?? null,
      material_type: parsed.data.materialType,
      is_teacher_only: parsed.data.isTeacherOnly,
      related_module_id: parsed.data.relatedModuleId ?? null,
    })
    .eq('id', id);
  if (error) throw new Error('Material konnte nicht aktualisiert werden: ' + error.message);
  revalidatePath('/admin/material');
  revalidatePath(`/admin/material/${id}`);
}

export async function deleteMaterial(id: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  // Datei aus Storage löschen (file_path holen)
  const { data: row } = await svc.from('materials').select('file_path').eq('id', id).maybeSingle();
  if (row?.file_path) {
    await svc.storage.from(STORAGE_BUCKET).remove([row.file_path as string]);
  }
  const { error } = await svc.from('materials').delete().eq('id', id);
  if (error) throw new Error('Material konnte nicht gelöscht werden: ' + error.message);
  revalidatePath('/admin/material');
  redirect('/admin/material');
}
