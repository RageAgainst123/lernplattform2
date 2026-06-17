'use server';

import { requireStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { publishBroadcast } from '@/lib/realtime/broadcast';
import { channels, events } from '@/lib/realtime/channels';

// Schüler:innen-Schreibpfad für Quiz-Teilnahme (Phase S, Migration 0020).
//
// Service-Role-Client, weil Schüler:innen kein auth.uid() haben. Die
// studentCodeId + classId kommen IMMER aus der jose-Session
// (requireStudentSession), NIE aus Client-Param — Schutz gegen IDOR.
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §5.3 (Lobby) + §7.3 (Team).

const TEAM_NAME_MAX = 40;

export type JoinQuizResult = {
  error: string | null;
  sessionId: string | null;
};

// Trimmt + cappt einen Teamnamen. null bei leerem Input — Caller entscheidet
// ob das ein Fehler ist (im Team-Modus ja, sonst ignoriert).
function normalizeTeamName(raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TEAM_NAME_MAX);
}

// Mappt DB-Fehler auf freundliche Nachrichten. Unique-Violation auf
// (session_id, team_name) heißt: Teamname schon vergeben.
function joinErrorMessage(error: { code?: string }): string {
  if (error.code === '23505') {
    return 'Dieser Teamname ist bereits vergeben — bitte einen anderen wählen.';
  }
  return 'Beitritt fehlgeschlagen.';
}

// Liest den Codename des Schülers (Snapshot beim Join — bleibt stabil
// falls der Codename später geändert wird). Fallback 'Anonym'.
async function loadCodename(
  supabase: ReturnType<typeof createServiceClient>,
  studentCodeId: string
): Promise<string> {
  const { data: codeRow } = await supabase
    .from('student_codes')
    .select('codename')
    .eq('id', studentCodeId)
    .maybeSingle();
  return (codeRow?.codename as string | undefined) ?? 'Anonym';
}

// Schüler:in tritt der aktiven Quiz-Session ihrer Klasse bei. Idempotent
// (ON CONFLICT bei doppelten Tabs). Im Team-Modus wird der Teamname
// validiert + getrimmt + auf 40 Zeichen gecappt.
export async function joinQuizSession(args?: { teamName?: string }): Promise<JoinQuizResult> {
  const session = await requireStudentSession();
  const supabase = createServiceClient();

  // Aktive Session der Klasse finden (Service-Role-Lookup; classId ist
  // authentisch aus der jose-Session, kein IDOR).
  const { data: sessionRow } = await supabase
    .from('quiz_sessions')
    .select('id, status, team_mode, heartbeat_at, mode')
    .eq('class_id', session.classId)
    .in('status', ['lobby', 'active', 'between_questions'])
    .maybeSingle();
  if (!sessionRow) {
    return { sessionId: null, error: 'Es läuft gerade kein Quiz für deine Klasse.' };
  }

  const teamName = sessionRow.team_mode ? normalizeTeamName(args?.teamName) : null;
  if (sessionRow.team_mode && !teamName) {
    return { sessionId: null, error: 'Bitte einen Teamnamen wählen.' };
  }

  const codename = await loadCodename(supabase, session.studentCodeId);
  const displayName = teamName ?? codename;
  const { error } = await supabase.from('quiz_participants').upsert(
    {
      session_id: sessionRow.id,
      student_code_id: session.studentCodeId,
      display_name: displayName,
      team_name: teamName,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,student_code_id' }
  );
  if (error) {
    return { sessionId: null, error: joinErrorMessage(error) };
  }
  // Phase T2: Broadcast „neue:r Teilnehmer:in" — Lehrer-Lobby aktualisiert
  // sofort die Liste statt erst nach Polling-Tick. Payload klein halten:
  // nur display_name (= Codename oder Teamname), kein student_code_id.
  void publishBroadcast(
    channels.quizSession(sessionRow.id as string),
    events.quiz.participantJoined,
    { displayName }
  );
  return { sessionId: sessionRow.id as string, error: null };
}

// PRE-LAUNCH-AUDIT CRIT-3 (2026-06-04): touchQuizPresence wurde geloescht.
// War als Server-Action exportiert ohne Session-Validierung — sessionId +
// studentCodeId aus Client-Param waeren Heartbeat-Spoofing-Vektor gewesen
// (beliebige Schueler:in als „aktiv" markieren). Aktuell niemals aufgerufen
// (toter Code), Heartbeat-Logik laeuft via last_seen_at in submitQuizAnswer
// + joinQuizSession. Falls in Zukunft ein expliziter Presence-Ping noetig
// wird: studentCodeId aus jose-Session, sessionId gegen classId der Session
// cross-checken.
