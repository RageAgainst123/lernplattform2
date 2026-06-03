import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { QuizMode, QuizQuestionRef, QuizSessionStatus } from '@/lib/schemas/quiz';

// Quiz-Session-Lesepfad (Phase S, Migration 0020).
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md
// Pattern: identisch zu lib/db/live-sessions.ts (Live-Präsentation).
//
// Schüler:innen-Pfade laufen via Service-Role (kein auth.uid()); die classId
// kommt aus der jose-Session des aufrufenden Route Handlers, NIE aus
// Client-Input. Lehrer:innen-Pfade nutzen den User-Client + RLS.

// Heartbeat-Tod: der Beamer-Tab pingt regelmäßig (alle 30 s, S1.B). Bleibt
// das Lebenszeichen länger als 120 s aus, gilt die Session als tot
// (Spec §11 D10 — Karenz 120 s statt 60 s wie bei Live-Präsentation, damit
// kurze WLAN-Aussetzer am Beamer-Tab das Quiz nicht killen).
const QUIZ_HEARTBEAT_DEAD_MS = 120 * 1000;

// Status-Werte, die als „läuft" gelten (vs. 'ended'). Genau diese drei
// werden vom partial-unique-Index quiz_sessions_one_active_per_class
// gesperrt — daher kann hier max eine Row zurückkommen.
const ACTIVE_STATUSES = ['lobby', 'active', 'between_questions'] as const;

export type ActiveQuizSession = {
  id: string;
  classId: string;
  moduleId: string;
  mode: QuizMode;
  status: QuizSessionStatus;
  currentQuestionIndex: number;
  currentQuestionStartedAt: string | null;
  timeLimitSeconds: number;
  scoringTimeLimitS: number;
  teamMode: boolean;
  showLeaderboardBetween: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  questionOrder: QuizQuestionRef[];
  dueDate: string | null;
  startedAt: string | null;
};

type QuizSessionRow = {
  id: string;
  class_id: string;
  module_id: string;
  mode: QuizMode;
  status: QuizSessionStatus;
  current_question_index: number;
  current_question_started_at: string | null;
  time_limit_seconds: number;
  scoring_time_limit_s: number;
  team_mode: boolean;
  show_leaderboard_between: boolean;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  question_order: QuizQuestionRef[];
  due_date: string | null;
  started_at: string | null;
  heartbeat_at: string;
};

function rowToSession(row: QuizSessionRow): ActiveQuizSession {
  return {
    id: row.id,
    classId: row.class_id,
    moduleId: row.module_id,
    mode: row.mode,
    status: row.status,
    currentQuestionIndex: row.current_question_index ?? 0,
    currentQuestionStartedAt: row.current_question_started_at,
    timeLimitSeconds: row.time_limit_seconds,
    scoringTimeLimitS: row.scoring_time_limit_s,
    teamMode: row.team_mode,
    showLeaderboardBetween: row.show_leaderboard_between,
    shuffleQuestions: row.shuffle_questions,
    shuffleAnswers: row.shuffle_answers,
    questionOrder: row.question_order ?? [],
    dueDate: row.due_date,
    startedAt: row.started_at,
  };
}

const SESSION_SELECT = [
  'id',
  'class_id',
  'module_id',
  'mode',
  'status',
  'current_question_index',
  'current_question_started_at',
  'time_limit_seconds',
  'scoring_time_limit_s',
  'team_mode',
  'show_leaderboard_between',
  'shuffle_questions',
  'shuffle_answers',
  'question_order',
  'due_date',
  'started_at',
  'heartbeat_at',
].join(', ');

// Liest die laufende Quiz-Session einer Klasse (max. eine durch den
// partial-unique-Index quiz_sessions_one_active_per_class). Gibt null
// zurück, wenn die Session tot ist (Heartbeat > 120 s aus). Die Row wird
// dabei NICHT mutiert — der nächste start_quiz_session beendet alte
// Sessions ohnehin atomar via RPC.
export async function getActiveQuizSessionForClass(
  classId: string
): Promise<ActiveQuizSession | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('quiz_sessions')
    .select(SESSION_SELECT)
    .eq('class_id', classId)
    .in('status', [...ACTIVE_STATUSES])
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as QuizSessionRow;
  // Hausaufgaben-Sessions haben keinen Beamer-Heartbeat — sie laufen bis
  // due_date oder bis sie manuell beendet werden. Heartbeat-Tod gilt nur
  // für live_class und team (Spec §6.5 vs. §5.7).
  if (row.mode !== 'homework') {
    const heartbeatAge = Date.now() - new Date(row.heartbeat_at).getTime();
    if (heartbeatAge > QUIZ_HEARTBEAT_DEAD_MS) return null;
  }
  return rowToSession(row);
}

// Teacher-seitiger Check (User-Client + RLS) ob für die Klasse gerade ein
// Quiz läuft — für das Konflikt-Banner und die gegenseitige Sperre
// zwischen Quiz und Live-Präsentation (Spec §3.11). Identische
// Heartbeat-Tod-Logik wie der Schüler:innen-Lesepfad.
export async function isQuizLiveForTeacher(classId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quiz_sessions')
    .select('mode, heartbeat_at')
    .eq('class_id', classId)
    .in('status', [...ACTIVE_STATUSES])
    .maybeSingle();
  if (!data) return false;
  if (data.mode === 'homework') return true;
  return Date.now() - new Date(data.heartbeat_at as string).getTime() <= QUIZ_HEARTBEAT_DEAD_MS;
}

// Banner-Info für die Schüler:innen-Sicht (Phase S1.E). Eine Service-Role-
// Query mit allem was der Banner braucht: aktive Session + Modul-Titel +
// ob die Schüler:in schon beigetreten ist. Wird im /s-Layout bei JEDEM
// Page-Load gerendert, daher kompakt halten.
// Banner zeigt nur 'lobby' und 'active' an (vor Frage-Start oder während
// einer laufenden Frage). 'between_questions' wird ausgefiltert — Beitritt
// zwischen Reveal und nächster Frage wäre verwirrend. 'ended' kommt durch
// getActiveQuizSessionForClass eh nicht durch.
export type StudentQuizBanner = {
  sessionId: string;
  moduleTitle: string;
  teamMode: boolean;
  status: 'lobby' | 'active';
  alreadyJoined: boolean;
};

export async function getQuizBannerForStudent(
  classId: string,
  studentCodeId: string
): Promise<StudentQuizBanner | null> {
  const session = await getActiveQuizSessionForClass(classId);
  if (!session) return null;
  // Nur lobby + active im Banner. between_questions wird ausgefiltert —
  // Beitritt mitten in einer Frage wäre verwirrend, später nochmal denken.
  // 'ended' kommt durch getActiveQuizSessionForClass eh nicht durch.
  if (session.status !== 'lobby' && session.status !== 'active') return null;
  const bannerStatus: 'lobby' | 'active' = session.status;
  const supabase = createServiceClient();
  const [moduleRow, participantRow] = await Promise.all([
    supabase.from('modules').select('title').eq('id', session.moduleId).maybeSingle(),
    supabase
      .from('quiz_participants')
      .select('student_code_id')
      .eq('session_id', session.id)
      .eq('student_code_id', studentCodeId)
      .maybeSingle(),
  ]);
  return {
    sessionId: session.id,
    moduleTitle: (moduleRow.data?.title as string | undefined) ?? 'Quiz',
    teamMode: session.teamMode,
    status: bannerStatus,
    alreadyJoined: !!participantRow.data,
  };
}

// Teilnehmer:innen-Liste einer Quiz-Session für die Beamer-Lobby (Spec §5.3).
// User-Client + RLS — quiz_participants_select_own_classes erzwingt, dass
// nur Lehrer:innen der eigenen Klassen lesen können.
export type QuizLobbyParticipant = {
  studentCodeId: string;
  displayName: string;
  teamName: string | null;
  joinedAt: string;
};

export async function getQuizParticipantsForTeacher(
  sessionId: string
): Promise<QuizLobbyParticipant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quiz_participants')
    .select('student_code_id, display_name, team_name, joined_at')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });
  if (error) throw new Error(`Teilnehmer:innen konnten nicht geladen werden: ${error.message}`);
  return (data ?? []).map((r) => ({
    studentCodeId: r.student_code_id as string,
    displayName: r.display_name as string,
    teamName: (r.team_name as string | null) ?? null,
    joinedAt: r.joined_at as string,
  }));
}
