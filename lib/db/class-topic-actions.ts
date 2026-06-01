'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

// Server Actions für die Themen-Zuweisung an Klassen (Phase G3). Ein Thema
// zuweisen heißt: ALLE veröffentlichten Module des Themas der Klasse zuweisen
// (per Bulk-Insert). Entfernen heißt: alle Modul-Zuweisungen wieder löschen,
// die zu diesem Thema gehören.
//
// Sicherheits-Modell: Lehrer:in nutzt User-Client + RLS (class_modules-Policy
// erzwingt teacher_id = auth.uid()). Für den Lookup der Modul-IDs zum Thema
// nutzen wir Service-Role — Topics + Module sind nicht teacher-gebunden.

export type ClassTopicActionState = { error: string | null };

// Modul-IDs eines Themas (nur veröffentlichte) ermitteln — Service-Role-Read
// reicht hier, weil topics + modules öffentlich lesbar sind.
async function getPublishedModuleIdsForTopic(topicId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('modules')
    .select('id')
    .eq('topic_id', topicId)
    .eq('is_published', true);
  if (error) throw new Error(`Modul-IDs konnten nicht geladen werden: ${error.message}`);
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

// Weist alle veröffentlichten Module eines Themas einer Klasse zu. Bereits
// zugewiesene Module werden via upsert (onConflict) übersprungen — Re-Assign
// soll keinen Fehler werfen.
export async function assignTopicToClass(
  classId: string,
  topicId: string
): Promise<ClassTopicActionState> {
  await requireUser();
  if (!classId || !topicId) {
    return { error: 'Klasse oder Thema fehlt.' };
  }
  let moduleIds: string[];
  try {
    moduleIds = await getPublishedModuleIdsForTopic(topicId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Modul-IDs nicht ladbar.' };
  }
  if (moduleIds.length === 0) {
    return { error: 'Dieses Thema hat noch keine veröffentlichten Module.' };
  }
  const supabase = await createClient();
  // onConflict auf (class_id, module_id) → bestehende Zuweisungen unverändert
  const rows = moduleIds.map((module_id) => ({
    class_id: classId,
    module_id,
    due_date: null,
    pass_threshold: null,
  }));
  const { error } = await supabase
    .from('class_modules')
    .upsert(rows, { onConflict: 'class_id,module_id', ignoreDuplicates: true });
  if (error) {
    return { error: 'Das Thema konnte nicht zugewiesen werden: ' + error.message };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Entfernt alle Modul-Zuweisungen einer Klasse, die zu diesem Thema gehören.
// Fortschritts-Daten (student_progress) bleiben erhalten — wie bei
// unassignModuleFromClass.
export async function unassignTopicFromClass(
  classId: string,
  topicId: string
): Promise<ClassTopicActionState> {
  await requireUser();
  if (!classId || !topicId) {
    return { error: 'Klasse oder Thema fehlt.' };
  }
  let moduleIds: string[];
  try {
    // Hier alle Module des Themas (nicht nur veröffentlichte) — wenn
    // jemand ein Modul nachträglich auf draft setzt, soll die Zuweisung
    // trotzdem entfernbar sein.
    const svc = createServiceClient();
    const { data, error } = await svc.from('modules').select('id').eq('topic_id', topicId);
    if (error) throw new Error(error.message);
    moduleIds = ((data ?? []) as { id: string }[]).map((r) => r.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Modul-IDs nicht ladbar.' };
  }
  if (moduleIds.length === 0) {
    return { error: null }; // nichts zu tun
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('class_modules')
    .delete()
    .eq('class_id', classId)
    .in('module_id', moduleIds);
  if (error) {
    return { error: 'Das Thema konnte nicht entfernt werden: ' + error.message };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}
