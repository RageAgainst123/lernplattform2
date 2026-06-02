'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createStudentSession,
  STUDENT_COOKIE,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth/student-session';
import {
  SSO_PENDING_COOKIE,
  verifySsoPendingSession,
  type SsoPendingPayload,
} from '@/lib/auth/sso-pending-session';
import {
  joinClassWithO365,
  touchStudentLastActive,
  type JoinClassResult,
} from '@/lib/db/student-sso';
import { clearTeacherSession } from '@/lib/auth/session-cleanup';

// Phase O2: Server Action für /k/join.
// Liest sso_pending-Cookie (jose-signiert, enthält O365-User-Daten),
// verarbeitet eingegebenen Klassen-Code, ruft joinClassWithO365 → setzt
// student_session-Cookie → redirect /s.

export type JoinSsoState = { error: string | null };

const PENDING_EXPIRED = 'Deine Microsoft-Anmeldung ist abgelaufen. Melde dich bitte erneut an.';

async function readPending(): Promise<SsoPendingPayload | null> {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(SSO_PENDING_COOKIE)?.value;
  if (!pendingToken) return null;
  return verifySsoPendingSession(pendingToken);
}

function joinErrorMessage(result: Extract<JoinClassResult, { ok: false }>): string {
  if (result.error === 'invalid_code') {
    return 'Klassen-Code unbekannt. Frag deine Lehrer:in.';
  }
  return (
    'Beitritt fehlgeschlagen. Bitte erneut versuchen oder Lehrer:in fragen.' +
    (result.message ? ` (${result.message})` : '')
  );
}

async function persistStudentSession(studentCodeId: string, classId: string): Promise<void> {
  const cookieStore = await cookies();
  await clearTeacherSession();
  const token = await createStudentSession({ studentCodeId, classId });
  cookieStore.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
  cookieStore.delete(SSO_PENDING_COOKIE);
  await touchStudentLastActive(studentCodeId);
}

export async function joinSsoClass(_prev: JoinSsoState, formData: FormData): Promise<JoinSsoState> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) {
    return { error: 'Bitte einen Klassen-Code eingeben.' };
  }

  const pending = await readPending();
  if (!pending) {
    return { error: PENDING_EXPIRED };
  }

  const result = await joinClassWithO365({
    oid: pending.oid,
    email: pending.email,
    givenName: pending.givenName,
    surname: pending.surname,
    joinCode: code,
  });

  if (!result.ok) {
    return { error: joinErrorMessage(result) };
  }

  await persistStudentSession(result.studentCodeId, result.classId);
  redirect('/s');
}
