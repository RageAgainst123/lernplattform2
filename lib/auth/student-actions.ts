'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { STUDENT_COOKIE } from '@/lib/auth/student-session';
import { clearTeacherSession } from '@/lib/auth/session-cleanup';

// Meldet die Schüler:in ab (Session-Cookie löschen) und führt zur Startseite.
// Räumt zusätzlich eine eventuell parallel gesetzte Lehrer:innen-Session weg —
// es darf nie zwei aktive Rollen-Cookies gleichzeitig geben (siehe
// session-cleanup.ts und ADR-0008 + Phase 14 Doppel-Login-Fix).
export async function studentLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE);
  await clearTeacherSession();
  redirect('/');
}
