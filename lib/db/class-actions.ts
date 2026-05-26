'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { classInsertSchema } from '@/lib/schemas/entities';
import { requireUser } from '@/lib/auth/teacher-auth';

export type CreateClassState = { error: string | null };

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
  });

  if (error) {
    return { error: 'Die Klasse konnte nicht angelegt werden. Bitte erneut versuchen.' };
  }

  revalidatePath('/lehrer/klassen');
  redirect('/lehrer/klassen');
}
