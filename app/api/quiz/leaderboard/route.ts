import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/teacher-auth';
import { getStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { getActiveQuizSessionForClass, getRecentlyEndedQuizForClass } from '@/lib/db/quiz-sessions';
import { getQuizLeaderboard, findOwnEntry, type LeaderboardEntry } from '@/lib/db/quiz-leaderboard';

// Polling-Endpunkt fürs Leaderboard (Phase S3, Spec §5.6).
//
// Dual-Mode: Lehrer:in (Beamer) bekommt Top-5, Schüler:in bekommt eigenen
// Rang + Total. Auth-Diskriminator: ?mode=teacher (mit classId) vs.
// ?mode=student (via jose-Session).
//
// Latenz-Hinweis: Leaderboard wird nur in between_questions gepollt — nicht
// während active (da würde die Anzeige flackern). Hook-Seite (S3 UI)
// triggert Polling nur im Reveal-Bildschirm.

export const dynamic = 'force-dynamic';

export type TeacherLeaderboardState =
  | { kind: 'none' }
  | {
      kind: 'ok';
      sessionId: string;
      top: LeaderboardEntry[]; // Top-5
      totalParticipants: number;
    };

export type StudentLeaderboardState =
  | { kind: 'none' }
  | {
      kind: 'ok';
      sessionId: string;
      own: LeaderboardEntry; // eigener Eintrag mit Rang
      totalParticipants: number;
    };

function noStore(state: TeacherLeaderboardState | StudentLeaderboardState): NextResponse {
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

async function isOwnClass(teacherId: string, classId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .maybeSingle();
  return !!data && (data.teacher_id as string) === teacherId;
}

async function handleTeacher(classId: string | null): Promise<NextResponse> {
  const user = await getUser();
  if (!user || !classId) return noStore({ kind: 'none' });
  if (!(await isOwnClass(user.id, classId))) return noStore({ kind: 'none' });

  // Aktive ODER kürzlich beendete Session (Phase S4: das Podest am Quiz-
  // Ende braucht das Final-Leaderboard, auch wenn status='ended').
  const quiz =
    (await getActiveQuizSessionForClass(classId)) ?? (await getRecentlyEndedQuizForClass(classId));
  if (!quiz) return noStore({ kind: 'none' });

  const board = await getQuizLeaderboard(quiz.id);
  return noStore({
    kind: 'ok',
    sessionId: quiz.id,
    top: board.entries.slice(0, 5),
    totalParticipants: board.totalParticipants,
  });
}

async function handleStudent(): Promise<NextResponse> {
  const session = await getStudentSession();
  if (!session) return noStore({ kind: 'none' });

  const quiz =
    (await getActiveQuizSessionForClass(session.classId)) ??
    (await getRecentlyEndedQuizForClass(session.classId));
  if (!quiz) return noStore({ kind: 'none' });

  const board = await getQuizLeaderboard(quiz.id);
  const own = findOwnEntry(board, session.studentCodeId);
  if (!own) return noStore({ kind: 'none' });

  return noStore({
    kind: 'ok',
    sessionId: quiz.id,
    own,
    totalParticipants: board.totalParticipants,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');
  if (mode === 'teacher') {
    return handleTeacher(url.searchParams.get('classId'));
  }
  return handleStudent();
}
