'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { STUDENT_COOKIE } from '@/lib/auth/student-session';

// Meldet die Schüler:in ab (Session-Cookie löschen) und führt zur Startseite.
export async function studentLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE);
  redirect('/');
}
