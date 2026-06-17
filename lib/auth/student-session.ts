import { SignJWT, jwtVerify } from 'jose';

// Signiertes HTTP-Only-Cookie für Schüler:innen-Sessions (eigenes System, NICHT
// Supabase Auth). HS256. jose läuft auch im Edge-/Proxy-Runtime (Web Crypto,
// keine Node-Abhängigkeiten).
//
// Lange Gültigkeit (1 Jahr): Schüler:innen nutzen FESTE/EIGENE Geräte und sollen
// nicht täglich neu einloggen — einmal anmelden, dann das ganze Schuljahr nutzbar
// (z. B. für Live-Präsentationen). Auf geteilten Geräten stattdessen den
// Abmelden-Knopf im Header verwenden. SESSION_DURATION_SECONDS wird auch fürs
// Cookie-maxAge in student-login-action.ts genutzt — beide MÜSSEN gleich sein.
export const STUDENT_COOKIE = 'student_session';
export const SESSION_DURATION_SECONDS = 365 * 24 * 60 * 60; // 1 Jahr
const EXPIRY = `${SESSION_DURATION_SECONDS}s`;

export type StudentSession = {
  studentCodeId: string;
  classId: string;
};

// Secret zur Laufzeit lesen (nicht beim Import), damit Tests es setzen können.
function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error('SESSION_SECRET ist nicht gesetzt.');
  }
  return new TextEncoder().encode(value);
}

export async function createStudentSession(payload: StudentSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifyStudentSession(token: string): Promise<StudentSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.studentCodeId !== 'string' || typeof payload.classId !== 'string') {
      return null;
    }
    return { studentCodeId: payload.studentCodeId, classId: payload.classId };
  } catch {
    return null;
  }
}
