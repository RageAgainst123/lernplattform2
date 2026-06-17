import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Leaderboard-Aggregation (Phase S3, Spec §5.6).
//
// Architektur-Entscheidung: total_points wird NICHT in quiz_participants
// gecached (siehe quiz-answer-actions.ts), sondern pro Aufruf aus
// quiz_answers aggregiert. Das vermeidet jede Race-Condition beim
// gleichzeitigen Submit von 25 Schüler:innen.
//
// Performance: bei <30 Schüler:innen + <30 Fragen sind das ~900 Rows zum
// summieren — Postgres macht das in <5 ms. Index
// quiz_answers_session_q_idx unterstützt den session_id-Scan.

export type LeaderboardEntry = {
  studentCodeId: string;
  displayName: string; // codename oder team_name
  isTeam: boolean;
  totalPoints: number;
  correctCount: number;
  rank: number; // 1-basiert, RANK() OVER → bei Punktgleichstand gleicher Rang
};

export type Leaderboard = {
  sessionId: string;
  entries: LeaderboardEntry[]; // sortiert: rank asc
  totalParticipants: number;
};

type ParticipantRow = {
  student_code_id: string;
  team_name: string | null;
  student_codes: { codename: string } | { codename: string }[] | null;
};

type AnswerRow = {
  student_code_id: string;
  points_awarded: number;
  is_correct: boolean;
};

// Holt das Leaderboard für eine Quiz-Session. Sortiert absteigend nach
// totalPoints, mit RANK()-Logik (Punktgleichstand = gleicher Rang, nächster
// überspringt). Bei 0 Antworten: alle haben 0 Punkte, alle Rang 1.
export async function getQuizLeaderboard(sessionId: string): Promise<Leaderboard> {
  const supabase = createServiceClient();

  // Schritt 1: alle Teilnehmer:innen laden (inkl. Codename via Join).
  // Wir brauchen ALLE Teilnehmer:innen, nicht nur die mit Antworten —
  // sonst tauchen Spät-Joiner ohne Antworten gar nicht auf.
  const { data: participants } = await supabase
    .from('quiz_participants')
    .select('student_code_id, team_name, student_codes!inner(codename)')
    .eq('session_id', sessionId);

  // Schritt 2: alle Antworten der Session laden (für Punkte-Summe + correct).
  const { data: answers } = await supabase
    .from('quiz_answers')
    .select('student_code_id, points_awarded, is_correct')
    .eq('session_id', sessionId);

  const partList = (participants ?? []) as ParticipantRow[];
  const ansList = (answers ?? []) as AnswerRow[];

  const aggregates = aggregateByStudent(ansList);
  const merged = mergeParticipantsWithScores(partList, aggregates);
  const ranked = rankEntries(merged);

  return {
    sessionId,
    entries: ranked,
    totalParticipants: ranked.length,
  };
}

type ScoreAggregate = { totalPoints: number; correctCount: number };

function aggregateByStudent(answers: AnswerRow[]): Map<string, ScoreAggregate> {
  const map = new Map<string, ScoreAggregate>();
  for (const a of answers) {
    const prev = map.get(a.student_code_id) ?? { totalPoints: 0, correctCount: 0 };
    map.set(a.student_code_id, {
      totalPoints: prev.totalPoints + (a.points_awarded ?? 0),
      correctCount: prev.correctCount + (a.is_correct ? 1 : 0),
    });
  }
  return map;
}

function codenameFrom(row: ParticipantRow): string {
  const sc = row.student_codes;
  if (!sc) return '???';
  if (Array.isArray(sc)) return sc[0]?.codename ?? '???';
  return sc.codename;
}

function mergeParticipantsWithScores(
  participants: ParticipantRow[],
  scores: Map<string, ScoreAggregate>
): Omit<LeaderboardEntry, 'rank'>[] {
  return participants.map((p) => {
    const agg = scores.get(p.student_code_id) ?? { totalPoints: 0, correctCount: 0 };
    return {
      studentCodeId: p.student_code_id,
      displayName: p.team_name ?? codenameFrom(p),
      isTeam: !!p.team_name,
      totalPoints: agg.totalPoints,
      correctCount: agg.correctCount,
    };
  });
}

// RANK()-Semantik: gleiche Punkte → gleicher Rang, nächster überspringt
// (Standard-Wettkampf-Rangfolge). Sortiert absteigend nach Punkten.
export function rankEntries(entries: Omit<LeaderboardEntry, 'rank'>[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);
  let lastPoints = Number.POSITIVE_INFINITY;
  let lastRank = 0;
  return sorted.map((e, i) => {
    if (e.totalPoints < lastPoints) {
      lastRank = i + 1;
      lastPoints = e.totalPoints;
    }
    return { ...e, rank: lastRank };
  });
}

// Findet den eigenen Eintrag eines Schüler:in / Teams im Leaderboard.
// Returns null wenn nicht teilgenommen.
export function findOwnEntry(board: Leaderboard, studentCodeId: string): LeaderboardEntry | null {
  return board.entries.find((e) => e.studentCodeId === studentCodeId) ?? null;
}
