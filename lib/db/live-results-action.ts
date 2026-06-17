'use server';

import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  getVoteAggregate,
  getQuizCorrectOptions,
  type ActiveLiveSession,
} from '@/lib/db/live-sessions';
import { countPresence, countVoters } from '@/lib/db/live-presence';

// Lehrer:innen-Actions für den Beamer: Stimmen-Aggregate, Wortwolke, Quiz-Auflösung.
// requireUser + RLS (live_sessions only_own); Aggregation über Service-Role.

export type AggregateResult =
  | {
      counts: Record<string, number>;
      revealed: boolean;
      locked: boolean;
      present: number;
      voters: number;
    }
  | { error: string };

// Hilfsfunktion: aktive Session einer eigenen Klasse lesen (RLS-gesichert).
async function getOwnSession(classId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('id, current_block_revealed, current_block_locked')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

export async function getLiveResults(classId: string, blockId: string): Promise<AggregateResult> {
  await requireUser();
  const data = await getOwnSession(classId);
  if (!data) {
    return { counts: {}, revealed: false, locked: false, present: 0, voters: 0 };
  }
  const [counts, present, voters] = await Promise.all([
    getVoteAggregate(data.id, blockId),
    countPresence(data.id),
    countVoters(data.id, blockId),
  ]);
  return {
    counts,
    revealed: data.current_block_revealed as boolean,
    locked: data.current_block_locked as boolean,
    present,
    voters,
  };
}

export type WordCloudResult = { word: string; count: number }[] | { error: string };

// Wortwolken-Aggregat: liest free_text-Stimmen, normalisiert (lowercase/trim),
// zählt Duplikate, sortiert nach Häufigkeit. Max 50 Einträge.
export async function getWordCloudResults(
  classId: string,
  blockId: string
): Promise<WordCloudResult> {
  await requireUser();
  const session = await getOwnSession(classId);
  if (!session) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('live_votes')
    .select('free_text')
    .eq('session_id', session.id)
    .eq('block_id', blockId)
    .not('free_text', 'is', null);
  if (error) return { error: 'Ergebnisse konnten nicht geladen werden.' };
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const word = (row.free_text as string).trim().toLowerCase();
    if (word) counts[word] = (counts[word] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));
}

export type QuizCorrectResult = string[] | { error: string };

// Richtige Antwort-IDs für quiz_poll — NUR für den Beamer. Liest aus dem Modul-JSON.
export async function getQuizCorrectOptionsAction(
  classId: string,
  blockId: string
): Promise<QuizCorrectResult> {
  await requireUser();
  const supabase = await createClient();
  const { data: sessionData } = await supabase
    .from('live_sessions')
    .select('id, module_id, current_block_index, current_block_locked, created_at, updated_at')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!sessionData) return [];
  // ActiveLiveSession-Shape für getQuizCorrectOptions aufbauen.
  const session: ActiveLiveSession = {
    id: sessionData.id,
    moduleId: sessionData.module_id,
    currentBlockIndex: sessionData.current_block_index ?? 0,
    locked: (sessionData.current_block_locked as boolean | null) ?? false,
  };
  return getQuizCorrectOptions(session, blockId);
}
