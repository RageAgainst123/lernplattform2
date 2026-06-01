'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { topicInsertSchema } from '@/lib/schemas/entities';

// Server Actions für Topic-CRUD im Admin-Bereich. Pattern wie module-actions.ts:
// requireAdmin() → Service-Role-Client. Sicherheit durch requireAdmin, nicht RLS.

const topicFormSchema = topicInsertSchema;

function rowFromInsert(input: z.infer<typeof topicFormSchema>) {
  return {
    slug: input.slug,
    label: input.label,
    description: input.description ?? null,
    schulstufe: input.schulstufe ?? null,
    kompetenzbereich: input.kompetenzbereich ?? null,
    is_published: input.isPublished,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function createTopic(input: unknown): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = topicFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('topics')
    .insert(rowFromInsert(parsed.data))
    .select('id')
    .single();
  if (error) throw new Error('Thema konnte nicht angelegt werden: ' + error.message);
  revalidatePath('/admin/themen');
  return { id: data.id as string };
}

export async function updateTopic(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const parsed = topicFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { error } = await svc.from('topics').update(rowFromInsert(parsed.data)).eq('id', id);
  if (error) throw new Error('Thema konnte nicht aktualisiert werden: ' + error.message);
  revalidatePath('/admin/themen');
  revalidatePath(`/admin/themen/${id}`);
}

export async function deleteTopic(id: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  // Erst Bezüge lösen (FK on delete set null sorgt eigentlich dafür, aber
  // explizit damit die Zuordnung im UI sofort verschwindet — die Module/
  // Materialien selbst bleiben erhalten, nur ihre topic_id wird null).
  await svc.from('modules').update({ topic_id: null, sort_order: 0 }).eq('topic_id', id);
  await svc.from('materials').update({ topic_id: null }).eq('topic_id', id);
  const { error } = await svc.from('topics').delete().eq('id', id);
  if (error) throw new Error('Thema konnte nicht gelöscht werden: ' + error.message);
  revalidatePath('/admin/themen');
  redirect('/admin/themen');
}

// Reihenfolge der Module innerhalb eines Themas setzen. Erwartet ein Array
// von { moduleId, sortOrder } in der gewünschten Reihenfolge.
export async function setTopicModuleOrder(
  topicId: string,
  ordering: { moduleId: string; sortOrder: number }[]
): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  // Bulk-Update einzeln — Supabase Postgrest hat keinen Bulk-Update-Syntax
  // mit verschiedenen Werten. Bei <50 Bausteinen pro Thema absolut ok.
  for (const item of ordering) {
    const { error } = await svc
      .from('modules')
      .update({ sort_order: item.sortOrder })
      .eq('id', item.moduleId)
      .eq('topic_id', topicId);
    if (error) throw new Error('Reihenfolge konnte nicht gesetzt werden: ' + error.message);
  }
  revalidatePath(`/admin/themen/${topicId}`);
}

// Modul einem Thema zuordnen oder Zuordnung lösen (topicId === null).
export async function setModuleTopic(moduleId: string, topicId: string | null): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  const update: { topic_id: string | null; sort_order?: number } = { topic_id: topicId };
  // Wenn neu zugeordnet, ans Ende setzen (höchster sort_order + 1).
  if (topicId) {
    const { data } = await svc
      .from('modules')
      .select('sort_order')
      .eq('topic_id', topicId)
      .order('sort_order', { ascending: false })
      .limit(1);
    const maxSort = (data?.[0]?.sort_order as number | undefined) ?? 0;
    update.sort_order = maxSort + 1;
  } else {
    update.sort_order = 0;
  }
  const { error } = await svc.from('modules').update(update).eq('id', moduleId);
  if (error) throw new Error('Modul-Zuordnung fehlgeschlagen: ' + error.message);
  revalidatePath('/admin/themen');
  if (topicId) revalidatePath(`/admin/themen/${topicId}`);
}
