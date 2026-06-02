import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  createStudentSession,
  STUDENT_COOKIE,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth/student-session';
import {
  createSsoPendingSession,
  SSO_PENDING_COOKIE,
  SSO_PENDING_COOKIE_OPTIONS,
} from '@/lib/auth/sso-pending-session';
import { clearTeacherSession } from '@/lib/auth/session-cleanup';
import {
  findStudentMembershipsByO365Oid,
  touchStudentLastActive,
  type StudentSsoMembership,
} from '@/lib/db/student-sso';

// Phase O2: OAuth-Callback für Schüler:innen-SSO via Microsoft 365.
//
// Flow:
//   1. Schüler:in hat auf /k auf "Mit Microsoft anmelden" geklickt
//   2. signInWithOAuth() leitet zu Microsoft → User loggt sich ein
//   3. Supabase ruft diesen Endpoint mit ?code=… auf
//   4. Wir tauschen den Code → bekommen user.identities[].identity_data
//   5. WICHTIG: wir verwerfen die Supabase-Auth-Session direkt wieder
//      (signOut), weil Schüler:innen den jose-Cookie nutzen, nicht den
//      Supabase-Cookie. Sonst hätten wir Doppel-Login.
//   6. findStudentMembershipsByO365Oid(oid):
//      - 0 Treffer  → sso_pending-Cookie setzen → /k/join
//      - ≥1 Treffer → jose-student_session-Cookie für ersten Treffer → /s

type O365Identity = {
  oid: string;
  email: string;
  givenName: string;
  surname: string;
};

function readMetaString(meta: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return '';
}

function extractO365Identity(user: User): O365Identity | null {
  const azureIdentity = user.identities?.find((i) => i.provider === 'azure');
  const oid = (azureIdentity?.identity_data?.sub as string | undefined) ?? null;
  const email = user.email ?? '';
  if (!oid || !email) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    oid,
    email,
    givenName: readMetaString(meta, 'given_name'),
    surname: readMetaString(meta, 'family_name', 'surname'),
  };
}

async function setPendingAndRedirect(identity: O365Identity, origin: string) {
  const token = await createSsoPendingSession(identity);
  const cookieStore = await cookies();
  cookieStore.set(SSO_PENDING_COOKIE, token, SSO_PENDING_COOKIE_OPTIONS);
  return NextResponse.redirect(new URL('/k/join', origin));
}

async function setStudentSessionAndRedirect(first: StudentSsoMembership, origin: string) {
  const studentToken = await createStudentSession({
    studentCodeId: first.studentCodeId,
    classId: first.classId,
  });
  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE, studentToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
  await touchStudentLastActive(first.studentCodeId);
  return NextResponse.redirect(new URL('/s', origin));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/k?error=oauth_no_code', origin));
  }

  const supabase = await createClient();
  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !exchangeData.user) {
    return NextResponse.redirect(new URL('/k?error=oauth_fehler', origin));
  }

  const identity = extractO365Identity(exchangeData.user);
  if (!identity) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/k?error=oauth_keine_id', origin));
  }

  let memberships;
  try {
    memberships = await findStudentMembershipsByO365Oid(identity.oid);
  } catch {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/k?error=db_fehler', origin));
  }

  await supabase.auth.signOut();
  await clearTeacherSession();

  if (memberships.length === 0) {
    return setPendingAndRedirect(identity, origin);
  }
  return setStudentSessionAndRedirect(memberships[0], origin);
}
