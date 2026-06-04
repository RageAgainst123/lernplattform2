'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPin } from '@/lib/auth/pin';
import {
  createStudentSession,
  STUDENT_COOKIE,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth/student-session';
import { clearTeacherSession } from '@/lib/auth/session-cleanup';
import { createServiceClient } from '@/lib/supabase/admin';
import { getClassByJoinCode, getStudentCodeForLogin } from '@/lib/db/student-login';
import { featureFlags, maintenanceMessages } from '@/lib/feature-flags';
import { checkLoginRate, ipFromHeaderList } from '@/lib/rate-limit';

export type StudentLoginState = { error: string | null };

const GENERIC_LOGIN_ERROR = 'Anmeldung nicht möglich. Bitte Code, Name und PIN prüfen.';
const RATE_LIMIT_ERROR =
  'Zu viele Anmelde-Versuche. Bitte warte 15 Minuten und versuche es erneut.';

// Server Action: Schüler:innen-Login mit Beitrittscode + Codename + PIN.
// Generische Fehlermeldung (kein Hinweis, ob Codename oder PIN falsch war).
//
// PRE-LAUNCH-AUDIT CRIT-2 (2026-06-04): Brute-Force-Schutz. 4-stellige PIN
// (10 000 Kombi × 80 ms bcrypt = ~14 Min/Account ohne Limit). Jetzt: 5 Versuche
// pro 15 Min pro IP+joinCode+codename-Tupel. Verhindert auch dass eine einzelne
// IP nacheinander durch alle Codenames einer Klasse phisht.
export async function studentLogin(
  _prev: StudentLoginState,
  formData: FormData
): Promise<StudentLoginState> {
  if (!featureFlags.isStudentLoginEnabled()) {
    return { error: maintenanceMessages.studentLogin.student };
  }
  const joinCode = String(formData.get('joinCode') ?? '');
  const codename = String(formData.get('codename') ?? '');
  const pin = String(formData.get('pin') ?? '');

  // Rate-Limit-Key: IP + joinCode + codename. Trim/lowercase damit Tippfehler
  // wie „  alpha-bär  " vs „alpha-bär" gleich behandelt werden.
  const ip = ipFromHeaderList(await headers());
  const loginKey = `login:${ip}:${joinCode.trim().toUpperCase()}:${codename.trim().toLowerCase()}`;
  const rate = checkLoginRate(loginKey);
  if (!rate.ok) {
    return { error: RATE_LIMIT_ERROR };
  }

  const schoolClass = await getClassByJoinCode(joinCode);
  if (!schoolClass) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const code = await getStudentCodeForLogin(schoolClass.id, codename);
  if (!code || !(await verifyPin(pin, code.pinHash))) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Falls parallel eine Lehrer:in-Session existiert: beenden, damit es nie
  // zwei aktive Rollen-Cookies gleichzeitig gibt (siehe session-cleanup.ts).
  await clearTeacherSession();

  const token = await createStudentSession({ studentCodeId: code.id, classId: schoolClass.id });
  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

  await createServiceClient()
    .from('student_codes')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', code.id);

  redirect('/s');
}
