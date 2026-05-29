'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';

// Server Actions für die Modul-Zuweisung an Klassen. Beide rufen
// requireUser() (Server-Auth-Check) und nutzen den User-Client mit RLS —
// die Policy `class_modules_all_own` erzwingt, dass nur Klassen mit
// teacher_id = auth.uid() geändert werden dürfen. Service-Role wird NICHT
// genutzt, sonst Sicherheits-Lücke.

export type ClassModuleActionState = { error: string | null };

// Weist ein veröffentlichtes Modul einer Klasse zu. Optional mit Fälligkeits-
// datum (ISO-String 'YYYY-MM-DD'). Bei Duplikat liefert RLS einen Fehler →
// wir geben eine generische Meldung zurück.
export async function assignModuleToClass(
  classId: string,
  moduleId: string,
  dueDate?: string | null
): Promise<ClassModuleActionState> {
  await requireUser();
  if (!classId || !moduleId) {
    return { error: 'Klasse oder Modul fehlt.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('class_modules').insert({
    class_id: classId,
    module_id: moduleId,
    due_date: dueDate || null,
  });
  if (error) {
    return {
      error: 'Das Modul konnte nicht zugewiesen werden. Möglicherweise ist es bereits zugewiesen.',
    };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Entfernt die Zuweisung. Fortschritts-Daten (student_progress) bleiben
// erhalten (kein CASCADE auf student_progress) — wenn das Modul später neu
// zugewiesen wird, sehen Schüler:innen ihren alten Fortschritt wieder.
export async function unassignModuleFromClass(
  classId: string,
  moduleId: string
): Promise<ClassModuleActionState> {
  await requireUser();
  if (!classId || !moduleId) {
    return { error: 'Klasse oder Modul fehlt.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('class_modules')
    .delete()
    .eq('class_id', classId)
    .eq('module_id', moduleId);
  if (error) {
    return { error: 'Das Modul konnte nicht entfernt werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}
