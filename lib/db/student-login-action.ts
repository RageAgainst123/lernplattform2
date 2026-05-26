'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPin } from '@/lib/auth/pin';
import { createStudentSession, STUDENT_COOKIE } from '@/lib/auth/student-session';
import { createServiceClient } from '@/lib/supabase/admin';
import { getClassByJoinCode, getStudentCodeForLogin } from '@/lib/db/student-login';

export type StudentLoginState = { error: string | null };

// Server Action: Schüler:innen-Login mit Beitrittscode + Codename + PIN.
// Generische Fehlermeldung (kein Hinweis, ob Codename oder PIN falsch war).
export async function studentLogin(
  _prev: StudentLoginState,
  formData: FormData
): Promise<StudentLoginState> {
  const joinCode = String(formData.get('joinCode') ?? '');
  const codename = String(formData.get('codename') ?? '');
  const pin = String(formData.get('pin') ?? '');

  const schoolClass = await getClassByJoinCode(joinCode);
  if (!schoolClass) {
    return { error: 'Anmeldung nicht möglich. Bitte Code, Name und PIN prüfen.' };
  }

  const code = await getStudentCodeForLogin(schoolClass.id, codename);
  if (!code || !(await verifyPin(pin, code.pinHash))) {
    return { error: 'Anmeldung nicht möglich. Bitte Code, Name und PIN prüfen.' };
  }

  const token = await createStudentSession({ studentCodeId: code.id, classId: schoolClass.id });
  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });

  await createServiceClient()
    .from('student_codes')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', code.id);

  redirect('/s');
}
