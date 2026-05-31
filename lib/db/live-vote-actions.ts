'use server';

import { getStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { getActiveSessionForClass } from '@/lib/db/live-sessions';

// Abstimmen in einer Live-Poll-Folie. Schüler:innen haben kein auth.uid() →
// Service-Role + jose-Session (studentCodeId aus der Session, NIE aus Client).
// Eine Stimme pro Kind/Frage (unique session_id,block_id,student_code_id);
// Re-Vote überschreibt per upsert.

export type VoteState = { error: string | null };

export async function submitPollVote(blockId: string, optionId: string): Promise<VoteState> {
  const session = await getStudentSession();
  if (!session) {
    return { error: 'Nicht angemeldet.' };
  }
  const live = await getActiveSessionForClass(session.classId);
  if (!live) {
    return { error: 'Gerade läuft keine Präsentation.' };
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('live_votes').upsert(
    {
      session_id: live.id,
      block_id: blockId,
      option_id: optionId,
      student_code_id: session.studentCodeId,
    },
    { onConflict: 'session_id,block_id,student_code_id' }
  );
  if (error) {
    return { error: 'Deine Stimme konnte nicht gespeichert werden.' };
  }
  return { error: null };
}
