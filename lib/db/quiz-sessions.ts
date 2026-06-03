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
