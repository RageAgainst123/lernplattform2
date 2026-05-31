'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';

// Server Actions für die Live-Präsentation (Lehrer:innen-Steuerung). Alle laufen
// hinter requireUser() über den User-Client mit RLS — die Policy
// live_sessions_all_own erzwingt, dass nur Sessions EIGENER Klassen geändert
// werden. Service-Role wird NICHT genutzt.

export type LiveActionState = { error: string | null };

// Startet eine Präsentation für eine Klasse. Beendet eine evtl. laufende Session
// und legt atomar eine neue an (RPC start_live_session — partial unique index als
// Sicherheitsnetz). Setzt current_block_index auf 0.
export async function startPresentation(
  classId: string,
  moduleId: string
): Promise<LiveActionState> {
  await requireUser();
  if (!classId || !moduleId) {
    return { error: 'Klasse oder Modul fehlt.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('start_live_session', {
    p_class: classId,
    p_module: moduleId,
  });
  if (error) {
    return { error: 'Die Präsentation konnte nicht gestartet werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}

// Setzt die aktuelle Folie/den aktuellen Block der laufenden Session. Wird bei
// jedem Folienwechsel im Beamer aufgerufen — die Schüler:innen-Geräte pollen
// diesen Wert. Kein revalidate (Beamer-State ist client-lokal, Geräte pollen).
export async function setLiveBlock(classId: string, index: number): Promise<LiveActionState> {
  await requireUser();
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ current_block_index: safeIndex })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Folie konnte nicht aktualisiert werden.' };
  }
  return { error: null };
}

// Beendet die laufende Präsentation der Klasse — bei allen Schüler:innen-Geräten
// verschwindet danach das Overlay (nächster Poll liefert active:false).
export async function endPresentation(classId: string): Promise<LiveActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ status: 'ended' })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Die Präsentation konnte nicht beendet werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { error: null };
}
