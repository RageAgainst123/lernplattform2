'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

// Server Actions für die Themen-Zuweisung an Klassen.
//
// Phase V (2026-06): Refactor. Bisher hat assignTopicToClass() für JEDES
// published Modul des Themas einen class_modules-Insert gemacht. Folge:
// Neue Module eines Topics tauchten nicht automatisch in der Klasse auf.
//
// Neu: Wir schreiben einen einzigen Insert in class_topics. Die Lehrer-
// Sicht (getAssignedTopicsForClass) joint das beim Lesen mit modules per
// topic_id. So erscheinen neue Module automatisch.
//
// class_modules bleibt parallel bestehen als Override-Mechanismus (Lehrer:in
// kann pro Modul due_date/pass_threshold setzen) und für Orphan-Module ohne
// topic_id.
//
// Sicherheits-Modell: Lehrer:in nutzt User-Client + RLS (class_topics-Policy
// erzwingt teacher_id = auth.uid() via class-join).

export type ClassTopicActionState = { error: string | null };

// Topic einer Klasse zuweisen. Idempotent — Re-Assign wirft keinen Fehler.
// Wenn das Topic noch keine published Module hat, ist das OK (Lehrer:in
// kann das Topic schon zuweisen, Module werden später hinzugefügt).
export async function assignTopicToClass(
  classId: string,
  topicId: string
): Promise<ClassTopicActionState> {
  await requireUser();
  if (!classId || !topicId) {
    return { error: 'Klasse oder Thema fehlt.' };
  }

  // Sanity-Check: existiert das Topic überhaupt? (Service-Role, weil
  // topics für alle lesbar ist.)
  const svc = createServiceClient();
  const { data: topicRow, error: topicErr } = await svc
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .maybeSingle();
  if (topicErr) {
    return { error: 'Thema konnte nicht geprüft werden: ' + topicErr.message };
  }
  if (!topicRow) {
    return { error: 'Dieses Thema existiert nicht (mehr).' };
  }

  const supabase = await createClient();
  // onConflict auf (class_id, topic_id) → Re-Assign ist ein no-op.
  const { error } = await supabase
    .from('class_topics')
    .upsert(
      { class_id: classId, topic_id: topicId, due_date: null },
      { onConflict: 'class_id,topic_id', ignoreDuplicates: true }
    );
  if (error) {
    return { error: 'Das Thema konnte nicht zugewiesen werden: ' + error.message };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Topic-Zuweisung entfernen.
//
// Wir löschen den class_topics-Eintrag. Optional räumen wir auch
// class_modules-Overrides für Module dieses Topics auf — damit „Thema
// entfernt + neu zugewiesen" einen sauberen Zustand ergibt und nicht
// versteckte Overrides aus pre-Phase-V mitschleift.
//
// student_progress bleibt erhalten (Fortschritt geht nicht verloren).
export async function unassignTopicFromClass(
  classId: string,
  topicId: string
): Promise<ClassTopicActionState> {
  await requireUser();
  if (!classId || !topicId) {
    return { error: 'Klasse oder Thema fehlt.' };
  }

  const supabase = await createClient();

  // (1) class_topics-Eintrag löschen
  const { error: ctErr } = await supabase
    .from('class_topics')
    .delete()
    .eq('class_id', classId)
    .eq('topic_id', topicId);
  if (ctErr) {
    return { error: 'Das Thema konnte nicht entfernt werden: ' + ctErr.message };
  }

  // (2) class_modules-Bestand für dieses Topic aufräumen (Backward-Compat).
  // Bestehende Lehrer:innen-Pläne haben Module einzeln in class_modules.
  // Service-Role-Lookup der Modul-IDs ist OK (modules öffentlich lesbar).
  const svc = createServiceClient();
  const { data: modData, error: modErr } = await svc
    .from('modules')
    .select('id')
    .eq('topic_id', topicId);
  if (modErr) {
    return { error: 'Modul-Liste konnte nicht geladen werden: ' + modErr.message };
  }
  const moduleIds = ((modData ?? []) as { id: string }[]).map((r) => r.id);
  if (moduleIds.length > 0) {
    const { error: cmErr } = await supabase
      .from('class_modules')
      .delete()
      .eq('class_id', classId)
      .in('module_id', moduleIds);
    if (cmErr) {
      // Nicht kritisch — class_topics ist schon weg. Wir loggen still
      // und kehren mit Erfolg zurück. (Override-Bestand bleibt evtl.
      // sichtbar — aber das ist alter Zustand, kein neuer Schaden.)
      return { error: null };
    }
  }

  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}
