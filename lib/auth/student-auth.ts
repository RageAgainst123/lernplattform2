import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  STUDENT_COOKIE,
  verifyStudentSession,
  type StudentSession,
} from '@/lib/auth/student-session';

// Liest die Schüler:innen-Session aus dem HTTP-Only-Cookie. Null, wenn nicht
// angemeldet oder Token ungültig/abgelaufen.
export async function getStudentSession(): Promise<StudentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifyStudentSession(token);
}

// Für geschützte /s-Seiten: gibt die Session zurück oder leitet zur
// Code-Eingabe um.
export async function requireStudentSession(): Promise<StudentSession> {
  const session = await getStudentSession();
  if (!session) {
    redirect('/k');
  }
  return session;
}
