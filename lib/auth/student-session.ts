import { SignJWT, jwtVerify } from 'jose';

// Signiertes HTTP-Only-Cookie für Schüler:innen-Sessions (eigenes System, NICHT
// Supabase Auth). HS256, 8h Gültigkeit (Schul-Tag). jose läuft auch im Edge-/
// Proxy-Runtime (Web Crypto, keine Node-Abhängigkeiten).

export const STUDENT_COOKIE = 'student_session';
const EXPIRY = '8h';

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
