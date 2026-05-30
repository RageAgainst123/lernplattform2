'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';

// Server Actions für Lehrer:innen-Feedback + Rückgabe einer Abgabe. Beide rufen
// requireUser() und nutzen den User-Client mit RLS — die Policy
// `student_progress_update_own_classes` erzwingt, dass nur Abgaben aus eigenen
// Klassen geändert werden. Service-Role wird NICHT genutzt (RLS-Bypass-Gefahr).
//
// Die UPDATE-Policy ist nicht spaltengranular; die Actions begrenzen die
// schreibbaren Felder fachlich auf teacher_feedback, returned_at, completed_at
// und manual_marks.

export type FeedbackActionState = { error: string | null };

const MAX_FEEDBACK = 2000;

function validate(feedback: string): { trimmed: string } | { error: string } {
  const trimmed = feedback.trim();
  if (!trimmed) {
    return { error: 'Bitte ein kurzes Feedback eingeben.' };
  }
  if (trimmed.length > MAX_FEEDBACK) {
    return { error: `Feedback ist zu lang (max. ${MAX_FEEDBACK} Zeichen).` };
  }
  return { trimmed };
}

// Gibt die Abgabe zur Überarbeitung zurück: speichert Feedback + manuelle
// Häkchen und setzt completed_at zurück → die Schüler:in kann wieder editieren.
export async function returnSubmissionWithFeedback(
  classId: string,
  studentCodeId: string,
  moduleId: string,
  feedback: string,
  manualMarks: Record<string, boolean>
): Promise<FeedbackActionState> {
  await requireUser();
  const v = validate(feedback);
  if ('error' in v) return v;

  const supabase = await createClient();
  const { error } = await supabase
    .from('student_progress')
    .update({
      teacher_feedback: v.trimmed,
      manual_marks: manualMarks,
      returned_at: new Date().toISOString(),
      completed_at: null,
    })
    .eq('student_code_id', studentCodeId)
    .eq('module_id', moduleId);
  if (error) {
    return { error: 'Die Rückgabe ist fehlgeschlagen.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}/fortschritt`);
  return { error: null };
}

// Speichert nur Feedback + Häkchen, OHNE zurückzugeben (Modul bleibt für die
// Schüler:in gesperrt). Für Notizen/Vorbereitung vor der eigentlichen Rückgabe.
export async function saveFeedbackOnly(
  classId: string,
  studentCodeId: string,
  moduleId: string,
  feedback: string,
  manualMarks: Record<string, boolean>
): Promise<FeedbackActionState> {
  await requireUser();
  const trimmed = feedback.trim();
  if (trimmed.length > MAX_FEEDBACK) {
    return { error: `Feedback ist zu lang (max. ${MAX_FEEDBACK} Zeichen).` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('student_progress')
    .update({ teacher_feedback: trimmed || null, manual_marks: manualMarks })
    .eq('student_code_id', studentCodeId)
    .eq('module_id', moduleId);
  if (error) {
    return { error: 'Das Feedback konnte nicht gespeichert werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}/fortschritt`);
  return { error: null };
}
