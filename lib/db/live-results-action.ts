'use server';

import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { getVoteAggregate } from '@/lib/db/live-sessions';
import { countPresence, countVoters } from '@/lib/db/live-presence';

// Lehrer:innen-Action: liefert das Stimmen-Aggregat + Beamer-Steuerfelder der
// aktiven Session für den Beamer-Ergebnisbalken. requireUser + RLS (live_sessions
// only_own); Aggregation über Service-Role.

export type AggregateResult =
  | {
      counts: Record<string, number>;
      revealed: boolean;
      locked: boolean;
      present: number;
      voters: number;
    }
  | { error: string };

export async function getLiveResults(classId: string, blockId: string): Promise<AggregateResult> {
  await requireUser();
  const supabase = await createClient();
  // RLS: nur eigene Klassen sichtbar.
  const { data } = await supabase
    .from('live_sessions')
    .select('id, current_block_revealed, current_block_locked')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
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
