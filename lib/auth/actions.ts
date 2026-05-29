'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { clearStudentSession } from '@/lib/auth/session-cleanup';

// Meldet die Lehrer:in ab und leitet zur Login-Seite.
// revalidatePath vor dem Redirect, damit kein gecachter eingeloggter Zustand bleibt.
// Räumt zusätzlich eine eventuell parallel gesetzte Schüler:innen-Session weg —
// es darf nie zwei aktive Rollen-Cookies gleichzeitig geben (siehe
// session-cleanup.ts und ADR-0008 + Phase 14 Doppel-Login-Fix).
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearStudentSession();
  revalidatePath('/', 'layout');
  redirect('/login');
}
