'use server';

import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { getVoteAggregate } from '@/lib/db/live-sessions';

// Lehrer:innen-Action: liefert das Stimmen-Aggregat der aktiven Session einer
// Klasse für einen Poll-Block (Beamer-Ergebnisbalken). requireUser + RLS-Lese
// auf die eigene Session (live_sessions_all_own); das Zählen selbst läuft per
// Service-Role (getVoteAggregate), aber erst NACH der Klassen-Besitzprüfung.

export type AggregateResult = { counts: Record<string, number> } | { error: string };

export async function getLiveResults(classId: string, blockId: string): Promise<AggregateResult> {
  await requireUser();
  const supabase = await createClient();
  // RLS stellt sicher, dass nur eine Session EINER EIGENEN Klasse sichtbar ist.
  const { data } = await supabase
    .from('live_sessions')
    .select('id')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) {
    return { counts: {} };
  }
  const counts = await getVoteAggregate(data.id, blockId);
  return { counts };
}
