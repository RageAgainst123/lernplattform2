'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { classInsertSchema } from '@/lib/schemas/entities';
import { requireUser } from '@/lib/auth/teacher-auth';
import { generateJoinCode } from '@/lib/db/join-code';

export type CreateClassState = { error: string | null };

// Erzeugt einen freien Beitrittscode (Kollisionen bei 6 Zeichen sind selten,
// werden aber abgefangen).
async function freeJoinCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const { data } = await supabase
      .from('classes')
      .select('id')
      .eq('join_code', code)
      .maybeSingle();
    if (!data) {
      return code;
    }
  }
  return generateJoinCode();
}

// Server Action: legt eine neue Klasse für die eingeloggte Lehrer:in an.
// teacher_id = auth.uid() (RLS-Policy classes_all_own erzwingt das zusätzlich).
export async function createClass(
  _prev: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  const user = await requireUser();

  const raw = {
    name: String(formData.get('name') ?? '').trim(),
    schulstufe: formData.get('schulstufe') ? Number(formData.get('schulstufe')) : undefined,
  };

  const parsed = classInsertSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'Bitte einen gültigen Namen (und ggf. Schulstufe) eingeben.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('classes').insert({
    teacher_id: user.id,
    name: parsed.data.name,
    schulstufe: parsed.data.schulstufe ?? null,
    join_code: await freeJoinCode(supabase),
  });

  if (error) {
    return { error: 'Die Klasse konnte nicht angelegt werden. Bitte erneut versuchen.' };
  }

  revalidatePath('/lehrer/klassen');
  redirect('/lehrer/klassen');
}

// Klasse löschen (Phase nach Phase O):
// Lehrer:in löscht eine eigene Klasse. ON DELETE CASCADE in der DB räumt
// student_codes, class_modules, assigned_topics, live_sessions etc.
// automatisch auf.
//
// Sicherheits-Schutz:
//   - requireUser() erzwingt Lehrer:in-Login
//   - RLS-Policy classes_all_own erlaubt DELETE nur eigene Klassen
//     (teacher_id = auth.uid()) → fremde Klassen sind unreachable
//   - confirmName muss EXAKT mit dem Klassennamen übereinstimmen (Schutz vor
//     Fehlklick)

export type DeleteClassState = { error: string | null };

export async function deleteClass(classId: string, confirmName: string): Promise<DeleteClassState> {
  await requireUser();
  const supabase = await createClient();

  // Klassennamen zur Verifikation lesen — RLS sorgt dafür, dass nur eigene
  // Klassen sichtbar sind. Wenn die Klasse fehlt → fremde oder gelöscht.
  const { data: cls, error: readError } = await supabase
    .from('classes')
    .select('name')
    .eq('id', classId)
    .maybeSingle();
  if (readError) {
    return { error: 'Klasse konnte nicht gelesen werden.' };
  }
  if (!cls) {
    return { error: 'Klasse nicht gefunden.' };
  }
  if (confirmName.trim() !== (cls.name as string)) {
    return {
      error: `Zur Bestätigung den Klassennamen exakt eingeben: „${cls.name}".`,
    };
  }

  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) {
    return { error: `Löschen fehlgeschlagen: ${error.message}` };
  }

  revalidatePath('/lehrer/klassen');
  redirect('/lehrer/klassen');
}
