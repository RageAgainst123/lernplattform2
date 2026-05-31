import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Präsenz-Helfer für die Live-Präsentation. Schüler:innen-Geräte schreiben per
// Service-Role (kein auth.uid()); Lehrer:in liest per RLS. Alle Queries sind
// gegen die live_presence-Tabelle aus Migration 0010.

// Meldet ein Kind als „gerade aktiv" (pollt /api/live). Upsert auf PK
// (session_id, student_code_id) — last_seen wird auf now() aktualisiert.
// Service-Role: Schüler:innen haben kein auth.uid().
export async function touchPresence(sessionId: string, studentCodeId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('live_presence').upsert(
    {
      session_id: sessionId,
      student_code_id: studentCodeId,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'session_id,student_code_id' }
  );
}

// Zählt aktive Geräte (last_seen innerhalb der letzten 15 s). „Aktiv" heißt
// der Tab ist offen und das Polling läuft. Im Hintergrund-Tab pausiert der
// Browser das Polling → das Gerät fällt nach ~15 s aus dem Zähler (gewollt:
// zeigt wirklich aufmerksame Geräte, kein Anwesenheitsersatz).
export async function countPresence(sessionId: string): Promise<number> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 15_000).toISOString();
  const { count } = await supabase
    .from('live_presence')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .gte('last_seen', cutoff);
  return count ?? 0;
}

// Zählt abgegebene Stimmen für einen Block (alle, auch ältere/frühere).
export async function countVoters(sessionId: string, blockId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('live_votes')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('block_id', blockId);
  return count ?? 0;
}
