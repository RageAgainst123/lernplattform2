'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { STUDENT_COOKIE } from '@/lib/auth/student-session';
import { SSO_PENDING_COOKIE } from '@/lib/auth/sso-pending-session';

// Verhindert dass jemand gleichzeitig als Lehrer:in UND Schüler:in eingeloggt
// ist. Wird von beiden Login-Pfaden VOR dem Setzen des neuen Cookies aufgerufen.
//
// Beim Schüler:innen-Login: Supabase-Lehrer:in-Session beenden.
// Beim Lehrer:in-Login (Magic-Link-Callback): Schüler:innen-Cookie löschen.
//
// Hintergrund: Lehrer:in-Auth (Supabase) und Schüler:innen-Auth (jose) nutzen
// unterschiedliche Cookies — sind technisch unabhängig. Ohne diese Bereinigung
// können sie sich überlappen, was die UI verwirrt (Header zeigt eine Rolle,
// /s zeigt eine andere).

// Vor dem Schüler:innen-Login die Lehrer:in-Session beenden.
export async function clearTeacherSession(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// Vor dem Lehrer:in-Login die Schüler:innen-Session beenden.
// Phase O2: löscht auch den sso_pending-Cookie damit kein veralteter
// O365-Flow-Zustand zurückbleibt.
export async function clearStudentSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE);
  cookieStore.delete(SSO_PENDING_COOKIE);
}
