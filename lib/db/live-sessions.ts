import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { moduleContentSchema } from '@/lib/schemas/blocks';

// Service-Role-Lesepfad für die Live-Präsentation (Schüler:innen-Seite hat kein
// auth.uid()). Class-scoped per Application Logic: die classId kommt aus der
// jose-Session des aufrufenden Route Handlers, NIE aus Client-Input.

export type ActiveLiveSession = {
  id: string;
  moduleId: string;
  currentBlockIndex: number;
  locked: boolean;
};

// Heartbeat-Tod: der Beamer frischt updated_at regelmäßig auf (heartbeat-Action,
// alle 20 s). Bleibt ein Lebenszeichen länger als 60 s aus (Browser-Absturz,
// OS-Shutdown, harter Tab-Kill), gilt die Session als tot → das Kind-Overlay
// verschwindet nach ≤60 s statt erst nach dem 4-h-Netz. 60 s toleriert 2 verpasste
// 20-s-Heartbeats. Die Session wird NICHT mutiert (Idempotenz/Statistik); der
// nächste start_live_session beendet sie ohnehin via end-then-insert (RPC).
const HEARTBEAT_DEAD_MS = 60 * 1000; // 60 s

// Maximales Alter einer aktiven Session. Zweites Netz für den Fall, dass eine
// Session trotz Heartbeats unrealistisch lange läuft (z. B. vergessener Beamer).
const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 h

// Liest die aktive Session einer Klasse (max. eine — partial unique index).
// Gibt null zurück, wenn die Session tot (Heartbeat > 60 s aus) oder älter als
// 4 h ist — Schutz gegen stecken gebliebene Sessions nach Browser-Absturz/Tab-Kill.
export async function getActiveSessionForClass(classId: string): Promise<ActiveLiveSession | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('id, module_id, current_block_index, current_block_locked, created_at, updated_at')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) {
    return null;
  }
  const now = Date.now();
  // Heartbeat-Tod: kein Lebenszeichen seit > 60 s → Session gilt als beendet.
  if (now - new Date(data.updated_at as string).getTime() > HEARTBEAT_DEAD_MS) {
    return null;
  }
  // Zweites Netz: Sessions älter als 4 h werden als beendet behandelt.
  if (now - new Date(data.created_at as string).getTime() > SESSION_MAX_AGE_MS) {
    return null;
  }
  return {
    id: data.id,
    moduleId: data.module_id,
    currentBlockIndex: data.current_block_index ?? 0,
    locked: (data.current_block_locked as boolean | null) ?? false,
  };
}

// Teacher-seitige Prüfung (User-Client + RLS), ob für die Klasse gerade eine
// Session läuft — für das „Live-Präsentation läuft"-Banner im Dashboard, das die
// Session auch von einem anderen Gerät beenden kann. Identische Heartbeat-Tod-
// Logik wie der Schüler:innen-Lesepfad, damit das Banner nicht bei toten Sessions
// hängt. RLS stellt sicher, dass nur eigene Klassen sichtbar sind.
export async function isPresentationLiveForTeacher(classId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('updated_at')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) {
    return false;
  }
  return Date.now() - new Date(data.updated_at as string).getTime() <= HEARTBEAT_DEAD_MS;
}

// Diskriminierter Typ: was bekommt das Kind-Gerät bei einer interaktiven Folie?
// correct-Flags werden hier NIEMALS durchgereicht — nur der Beamer kennt die Lösung.
export type LiveInteraction =
  | {
      kind: 'live_poll';
      blockId: string;
      question: string;
      options: { id: string; text: string }[];
    }
  | {
      kind: 'quiz_poll';
      blockId: string;
      question: string;
      options: { id: string; text: string }[];
    }
  | { kind: 'word_cloud'; blockId: string; question: string }
  | {
      kind: 'scale';
      blockId: string;
      question: string;
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    }
  | { kind: 'understanding'; blockId: string; question?: string };

// Bildet einen Modul-Block auf die diskriminierte LiveInteraction ab. Bei
// quiz_poll wird das correct-Flag ENTFERNT — Sicherheits-Garantie gegen Leaks.
// Reine Folien (slide, text, …) → null (Aufrufer zeigt nur Dimm-Overlay).
function blockToInteraction(block: import('@/lib/schemas/blocks').Block): LiveInteraction | null {
  if (block.type === 'live_poll') {
    return {
      kind: 'live_poll',
      blockId: block.id,
      question: block.question,
      options: block.options.map((o) => ({ id: o.id, text: o.text })),
    };
  }
  if (block.type === 'quiz_poll') {
    return {
      kind: 'quiz_poll',
      blockId: block.id,
      question: block.question,
      options: block.options.map((o) => ({ id: o.id, text: o.text })),
    };
  }
  if (block.type === 'word_cloud') {
    return { kind: 'word_cloud', blockId: block.id, question: block.question };
  }
  if (block.type === 'scale') {
    return {
      kind: 'scale',
      blockId: block.id,
      question: block.question,
      min: block.min,
      max: block.max,
      minLabel: block.minLabel,
      maxLabel: block.maxLabel,
    };
  }
  if (block.type === 'understanding') {
    return { kind: 'understanding', blockId: block.id, question: block.question };
  }
  return null;
}

// Liefert die Interaktions-Daten des aktuellen Blocks, falls interaktiv.
export async function getActivePollForClass(
  session: ActiveLiveSession
): Promise<LiveInteraction | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('modules')
    .select('content')
    .eq('id', session.moduleId)
    .maybeSingle();
  const parsed = data ? moduleContentSchema.safeParse(data.content) : null;
  if (!parsed?.success) return null;
  const block = parsed.data.blocks[session.currentBlockIndex];
  if (!block) return null;
  return blockToInteraction(block);
}

// Liefert die IDs der richtigen Optionen eines quiz_poll-Blocks — NUR für den
// Beamer (Lehrer:in). Nie an Schüler:innen-Geräte senden.
export async function getQuizCorrectOptions(
  session: ActiveLiveSession,
  blockId: string
): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('modules')
    .select('content')
    .eq('id', session.moduleId)
    .maybeSingle();
  const parsed = data ? moduleContentSchema.safeParse(data.content) : null;
  if (!parsed?.success) return [];
  const block = parsed.data.blocks.find((b) => b.id === blockId);
  if (!block || block.type !== 'quiz_poll') return [];
  return block.options.filter((o) => o.correct).map((o) => o.id);
}

// Stimmen-Aggregat einer interaktiven Folie für den Beamer-Ergebnisbalken:
// option_id → Anzahl. Service-Role (Lehrer:in pollt das vom Beamer über eine
// Action; classId/blockId stammen aus dem aktiven Modul, kein Client-Leak).
export async function getVoteAggregate(
  sessionId: string,
  blockId: string
): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('live_votes')
    .select('option_id')
    .eq('session_id', sessionId)
    .eq('block_id', blockId)
    .not('option_id', 'is', null);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.option_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
