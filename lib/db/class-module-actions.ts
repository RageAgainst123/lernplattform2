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

// Bestehens-Schwelle validieren: null (keine) oder 0–100.
function validThreshold(value: number | null | undefined): value is number | null {
  return value === null || value === undefined || (value >= 0 && value <= 100);
}

// Weist ein veröffentlichtes Modul einer Klasse zu. Optional mit Fälligkeits-
// datum (ISO-String 'YYYY-MM-DD') und Bestehens-Schwelle in Prozent (0–100).
// Bei Duplikat liefert RLS einen Fehler → generische Meldung.
export async function assignModuleToClass(
  classId: string,
  moduleId: string,
  dueDate?: string | null,
  passThreshold?: number | null
): Promise<ClassModuleActionState> {
  await requireUser();
  if (!classId || !moduleId) {
    return { error: 'Klasse oder Modul fehlt.' };
  }
  if (!validThreshold(passThreshold)) {
    return { error: 'Schwelle muss zwischen 0 und 100 liegen.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('class_modules').insert({
    class_id: classId,
    module_id: moduleId,
    due_date: dueDate || null,
    pass_threshold: passThreshold ?? null,
  });
  if (error) {
    return {
      error: 'Das Modul konnte nicht zugewiesen werden. Möglicherweise ist es bereits zugewiesen.',
    };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Setzt die Bestehens-Schwelle einer bestehenden Zuweisung (null = keine).
export async function setPassThreshold(
  classId: string,
  moduleId: string,
  passThreshold: number | null
): Promise<ClassModuleActionState> {
  await requireUser();
  if (!validThreshold(passThreshold)) {
    return { error: 'Schwelle muss zwischen 0 und 100 liegen.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('class_modules')
    .update({ pass_threshold: passThreshold })
    .eq('class_id', classId)
    .eq('module_id', moduleId);
  if (error) {
    return { error: 'Die Schwelle konnte nicht gespeichert werden.' };
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
