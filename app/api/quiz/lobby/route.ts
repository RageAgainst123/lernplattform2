import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth/student-auth';
import { getUser } from '@/lib/auth/teacher-auth';
import {
  getActiveQuizSessionForClass,
  getQuizBannerForStudent,
  getQuizParticipantsForTeacher,
  type QuizLobbyParticipant,
} from '@/lib/db/quiz-sessions';
import { createServiceClient } from '@/lib/supabase/admin';
import { rateLimitGate } from '@/lib/rate-limit';

// Polling-Endpunkt für die Quiz-Lobby (Phase S1.C).
//
// Eine Route, zwei Sichten:
//   • Schüler:innen-Session  → liefert StudentLobbyState (banner-info,
//     ob bereits beigetreten, status)
//   • Lehrer:innen-Session   → liefert TeacherLobbyState (status, count,
//     teilnehmer-liste)
//   • keine Session          → 401-equivalent: { kind: 'none' }
//
// Sicherheit: classId kommt IMMER aus der jeweiligen Session — NIE aus
// Client-Param. Pfad ist im proxy.ts vom updateSession() ausgenommen
// (kein Supabase-Cookie-Refresh pro Poll).

export const dynamic = 'force-dynamic';

export type StudentLobbyState =
  | { kind: 'none' }
  | { kind: 'student'; banner: null }
  | {
      kind: 'student';
      banner: {
        sessionId: string;
        moduleTitle: string;
        teamMode: boolean;
        status: 'lobby' | 'active';
        alreadyJoined: boolean;
      };
    };

export type TeacherLobbyState =
  | { kind: 'none' }
  | { kind: 'teacher'; session: null }
  | {
      kind: 'teacher';
      session: {
        id: string;
        status: 'lobby' | 'active' | 'between_questions';
        participantCount: number;
        participants: QuizLobbyParticipant[];
      };
    };

export type QuizLobbyState = StudentLobbyState | TeacherLobbyState;

function noStore(state: QuizLobbyState): NextResponse {
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

// Schüler:innen-Sicht: gleiche Daten wie der Banner auf /s.
async function studentSnapshot(classId: string, studentCodeId: string): Promise<StudentLobbyState> {
  const banner = await getQuizBannerForStudent(classId, studentCodeId);
  return { kind: 'student', banner: banner ?? null };
}

// Lehrer:innen-Sicht: aktive Session + Teilnehmer-Liste über RLS-Pfad
// (User-Client). Wenn keine Session aktiv → session: null.
async function teacherSnapshot(classId: string): Promise<TeacherLobbyState> {
  const session = await getActiveQuizSessionForClass(classId);
  if (!session) return { kind: 'teacher', session: null };
  // Status 'between_questions' tritt erst ab S2 auf — heute praktisch nur
  // 'lobby' oder 'active'. Wir bleiben aber breit-typsicher.
  if (
    session.status !== 'lobby' &&
    session.status !== 'active' &&
    session.status !== 'between_questions'
  ) {
    return { kind: 'teacher', session: null };
  }
  const participants = await getQuizParticipantsForTeacher(session.id);
  return {
    kind: 'teacher',
    session: {
      id: session.id,
      status: session.status,
      participantCount: participants.length,
      participants,
    },
  };
}

export async function GET(request: Request) {
  const blocked = rateLimitGate(request, 'quiz-lobby');
  if (blocked) return blocked;
  // Lehrer:in muss classId per Query mitschicken (eine Lehrer:in kann
  // mehrere Klassen haben — anders als Schüler:innen). Wird unten gegen
  // RLS gegengeprüft (getActiveQuizSessionForClass läuft mit Service-Role,
  // aber die Klasse wird per Lehrer:in-RLS abgesichert über die Teilnehmer-
  // Query). Defensive: wenn die classId nicht zu einer eigenen Klasse
  // gehört, gibt RLS nichts zurück → session: null → harmlos.
  const url = new URL(request.url);
  const classIdParam = url.searchParams.get('classId');

  const student = await getStudentSession();
  if (student) {
    return noStore(await studentSnapshot(student.classId, student.studentCodeId));
  }

  const user = await getUser();
  if (user) {
    if (!classIdParam) return noStore({ kind: 'none' });
    // Sanity: ist die Klasse wirklich diese:r Lehrer:in? (RLS hätte die
    // Teilnehmer-Query eh leer zurückgegeben, aber wir prüfen die Klasse
    // explizit, damit wir keine session-Daten einer fremden Klasse leaken.)
    const supabase = createServiceClient();
    const { data: cls } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classIdParam)
      .maybeSingle();
    if (!cls || (cls.teacher_id as string) !== user.id) {
      return noStore({ kind: 'none' });
    }
    return noStore(await teacherSnapshot(classIdParam));
  }

  return noStore({ kind: 'none' });
}
