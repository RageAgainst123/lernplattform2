'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { moduleInsertSchema } from '@/lib/schemas/entities';

// Server Actions für Modul-CRUD im Admin-Bereich. Jede Aktion ruft requireAdmin()
// und nutzt dann den Service-Role-Client (umgeht RLS bewusst — Sicherheit wird
// durch requireAdmin gewährleistet, nicht durch RLS). Materialien analog.

// Formular → Modul-Insert/Update-Input. FormData wird in der Page in ein
// strukturiertes Objekt übersetzt; hier validieren wir nur via Zod.
const moduleFormSchema = moduleInsertSchema;

export type ActionState = { error: string | null; ok?: boolean };

function rowFromInsert(input: z.infer<typeof moduleFormSchema>, createdBy: string) {
  return {
    title: input.title,
    description: input.description ?? null,
    schulstufe: input.schulstufe ?? null,
    kompetenzbereich: input.kompetenzbereich ?? null,
    topic: input.topic ?? null,
    content: input.content,
    estimated_minutes: input.estimatedMinutes ?? null,
    is_published: input.isPublished,
    display_mode: input.displayMode,
    created_by: createdBy,
  };
}

export async function createModule(input: unknown): Promise<{ id: string }> {
  const user = await requireAdmin();
  const parsed = moduleFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('modules')
    .insert(rowFromInsert(parsed.data, user.id))
    .select('id')
    .single();
  if (error) throw new Error('Modul konnte nicht angelegt werden: ' + error.message);
  revalidatePath('/admin/module');
  return { id: data.id as string };
}

export async function updateModule(id: string, input: unknown): Promise<void> {
  const user = await requireAdmin();
  const parsed = moduleFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('modules')
    .update(rowFromInsert(parsed.data, user.id))
    .eq('id', id);
  if (error) throw new Error('Modul konnte nicht aktualisiert werden: ' + error.message);
  revalidatePath('/admin/module');
  revalidatePath(`/admin/module/${id}`);
}

export async function deleteModule(id: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  // Erst Verknüpfungen lösen (Foreign-Key set null), dann Modul löschen
  await svc.from('materials').update({ related_module_id: null }).eq('related_module_id', id);
  const { error } = await svc.from('modules').delete().eq('id', id);
  if (error) throw new Error('Modul konnte nicht gelöscht werden: ' + error.message);
  revalidatePath('/admin/module');
  revalidatePath('/admin/material');
  redirect('/admin/module');
}

// Material ↔ Modul-Verknüpfung setzen oder lösen (moduleId === null).
export async function linkMaterialToModule(
  materialId: string,
  moduleId: string | null
): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc
    .from('materials')
    .update({ related_module_id: moduleId })
    .eq('id', materialId);
  if (error) throw new Error('Verknüpfung konnte nicht gesetzt werden: ' + error.message);
  revalidatePath('/admin/material');
  revalidatePath(`/admin/material/${materialId}`);
}
