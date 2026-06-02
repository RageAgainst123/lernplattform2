import { SignJWT, jwtVerify } from 'jose';

// Phase O2: temporäres jose-Cookie für SSO-User die noch keiner Klasse
// beigetreten sind. Trägt die O365-Identitäts-Daten (oid + Email + Name)
// während der User auf /k/join den Klassen-Code eingibt.
//
// 10 Min TTL — genug Zeit um den Code von der Tafel abzutippen, kurz
// genug dass ein vergessenes Tab nicht ewig offen bleibt.
// Eigener Cookie-Name (sso_pending) damit der reguläre student_session-
// Cookie nicht überschrieben wird (Code+PIN-Login parallel möglich).

export const SSO_PENDING_COOKIE = 'sso_pending';
const TTL_SECONDS = 10 * 60;
const EXPIRY = `${TTL_SECONDS}s`;

export type SsoPendingPayload = {
  oid: string; // Microsoft Object ID (stabil, ändert sich nie)
  email: string;
  givenName: string;
  surname: string;
};

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error('SESSION_SECRET ist nicht gesetzt.');
  }
  return new TextEncoder().encode(value);
}

export async function createSsoPendingSession(payload: SsoPendingPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifySsoPendingSession(token: string): Promise<SsoPendingPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.oid !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.givenName !== 'string' ||
      typeof payload.surname !== 'string'
    ) {
      return null;
    }
    return {
      oid: payload.oid,
      email: payload.email,
      givenName: payload.givenName,
      surname: payload.surname,
    };
  } catch {
    return null;
  }
}

// Cookie-Optionen wie beim regulären student_session (HttpOnly, SameSite=lax).
export const SSO_PENDING_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: TTL_SECONDS,
  path: '/',
};
