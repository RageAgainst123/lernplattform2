'use server';

import { getStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { getActiveSessionForClass } from '@/lib/db/live-sessions';

// Abstimmen in einer Live-Interaktions-Folie. Schüler:innen haben kein auth.uid() →
// Service-Role + jose-Session (studentCodeId aus der Session, NIE aus Client).
// Eine Stimme pro Kind/Frage (unique session_id,block_id,student_code_id);
// Re-Vote überschreibt per upsert.
// Lock-Guard: wenn current_block_locked=true, werden Stimmen serverseitig abgelehnt —
// Schutz auch gegen manipulierte Clients.

export type VoteState = { error: string | null };

// Option-basierte Stimme (live_poll, quiz_poll, scale, understanding).
export async function submitPollVote(blockId: string, optionId: string): Promise<VoteState> {
  const session = await getStudentSession();
  if (!session) {
    return { error: 'Nicht angemeldet.' };
  }
  const live = await getActiveSessionForClass(session.classId);
  if (!live) {
    return { error: 'Gerade läuft keine Präsentation.' };
  }
  if (live.locked) {
    return { error: 'Die Abstimmung ist bereits geschlossen.' };
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

// Freitext-Stimme für word_cloud. option_id bleibt null; Längenschutz: max 40 Zeichen.
export async function submitTextVote(blockId: string, rawText: string): Promise<VoteState> {
  const session = await getStudentSession();
  if (!session) {
    return { error: 'Nicht angemeldet.' };
  }
  const text = rawText.trim().slice(0, 40);
  if (!text) {
    return { error: 'Bitte gib einen Text ein.' };
  }
  const live = await getActiveSessionForClass(session.classId);
  if (!live) {
    return { error: 'Gerade läuft keine Präsentation.' };
  }
  if (live.locked) {
    return { error: 'Die Abstimmung ist bereits geschlossen.' };
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('live_votes').upsert(
    {
      session_id: live.id,
      block_id: blockId,
      option_id: null,
      free_text: text,
      student_code_id: session.studentCodeId,
    },
    { onConflict: 'session_id,block_id,student_code_id' }
  );
  if (error) {
    return { error: 'Dein Beitrag konnte nicht gespeichert werden.' };
  }
  return { error: null };
}
