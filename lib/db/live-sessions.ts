import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { moduleContentSchema } from '@/lib/schemas/blocks';

// Service-Role-Lesepfad für die Live-Präsentation (Schüler:innen-Seite hat kein
// auth.uid()). Class-scoped per Application Logic: die classId kommt aus der
// jose-Session des aufrufenden Route Handlers, NIE aus Client-Input.

export type ActiveLiveSession = {
  id: string;
  moduleId: string;
  currentBlockIndex: number;
};

// Liest die aktive Session einer Klasse (max. eine — partial unique index).
export async function getActiveSessionForClass(classId: string): Promise<ActiveLiveSession | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('id, module_id, current_block_index')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    moduleId: data.module_id,
    currentBlockIndex: data.current_block_index ?? 0,
  };
}

export type LivePoll = {
  blockId: string;
  question: string;
  options: { id: string; text: string }[];
};

// Liefert den aktuellen Block der aktiven Session NUR, wenn er ein live_poll ist
// — und dann ausschließlich die für die Abstimmung nötigen Felder. So gelangt
// niemals Modul-Inhalt (Folientext, Lösungen anderer Blöcke) an die Geräte.
// Reine Folien geben null zurück → das Gerät zeigt nur das Dimm-Overlay.
export async function getActivePollForClass(session: ActiveLiveSession): Promise<LivePoll | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('modules')
    .select('content')
    .eq('id', session.moduleId)
    .maybeSingle();
  const parsed = data ? moduleContentSchema.safeParse(data.content) : null;
  if (!parsed?.success) {
    return null;
  }
  const block = parsed.data.blocks[session.currentBlockIndex];
  if (!block || block.type !== 'live_poll') {
    return null;
  }
  return {
    blockId: block.id,
    question: block.question,
    options: block.options.map((o) => ({ id: o.id, text: o.text })),
  };
}

// Stimmen-Aggregat einer Live-Poll-Folie für den Beamer-Ergebnisbalken:
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
    .eq('block_id', blockId);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.option_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
