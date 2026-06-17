'use server';

import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { clearStudentSession } from '@/lib/auth/session-cleanup';

// Phase O3+ (Klassen-Verlassen):
// Schüler:in löscht die eigene student_codes-Row in der aktuellen Klasse.
// Cascade-Foreign-Keys räumen student_progress, portfolio_entries,
// student_flashcard_state, student_streaks etc. automatisch auf.
//
// Sicherheit:
//   - studentCodeId/classId KOMMEN AUS DER jose-SESSION, nie aus Client-Param
//   - Service-Role-Client, weil Schüler:innen kein auth.uid() haben
//   - nach Löschen Session-Cookie weg → redirect /k

export async function leaveClass(): Promise<void> {
  const session = await requireStudentSession();
  const supabase = createServiceClient();

  // Nur die EIGENE Row der AKTUELLEN Klasse löschen.
  const { error } = await supabase
    .from('student_codes')
    .delete()
    .eq('id', session.studentCodeId)
    .eq('class_id', session.classId);

  if (error) {
    // Hart fehlschlagen — Schüler:in soll es nochmal versuchen.
    throw new Error(`Konnte Klasse nicht verlassen: ${error.message}`);
  }

  await clearStudentSession();
  redirect('/k');
}
