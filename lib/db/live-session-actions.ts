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
// diesen Wert. Reveal + Lock werden auf false zurückgesetzt: jede neue Folie
// startet verborgen und offen. Kein revalidate (Beamer-State ist client-lokal).
export async function setLiveBlock(classId: string, index: number): Promise<LiveActionState> {
  await requireUser();
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({
      current_block_index: safeIndex,
      current_block_revealed: false,
      current_block_locked: false,
    })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Folie konnte nicht aktualisiert werden.' };
  }
  return { error: null };
}

// Gibt das Ergebnis der aktuellen Poll-Folie auf dem Beamer frei. Einmal
// aufgerufen, bleibt das Ergebnis sichtbar bis zur nächsten Folie.
export async function revealResults(classId: string): Promise<LiveActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ current_block_revealed: true })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Ergebnis konnte nicht freigegeben werden.' };
  }
  return { error: null };
}

// Schließt die Abstimmung UND zeigt das Ergebnis in einem Atom-Update. Der
// häufigste Workflow für eine Lehrer:in ist „so, das war's, hier ist das
// Ergebnis" — zwei Klicks (Schließen → Auflösen) sind dafür zu viel. Die
// getrennten Buttons bleiben für den bewussten Pausen-Workflow erhalten.
export async function lockAndReveal(classId: string): Promise<LiveActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ current_block_locked: true, current_block_revealed: true })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Abstimmung konnte nicht abgeschlossen werden.' };
  }
  return { error: null };
}

// Sperrt (locked=true) oder öffnet (locked=false) die Abstimmung für die
// Schüler:innen. Bei locked=true können keine neuen Stimmen mehr abgegeben
// werden (Client disabled + Server-Guard in submitPollVote).
export async function setBlockLocked(classId: string, locked: boolean): Promise<LiveActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ current_block_locked: locked })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Abstimmungsstatus konnte nicht geändert werden.' };
  }
  return { error: null };
}

// Lebenszeichen des Beamers. Frischt updated_at der aktiven Session auf, damit
// getActiveSessionForClass sie nicht als tot (Heartbeat > 60 s) einstuft. Wird
// vom Beamer alle 20 s aufgerufen. Bleibt der Beamer weg (Absturz/Tab-Kill),
// altert updated_at und das Kind-Overlay verschwindet nach ≤60 s automatisch.
export async function heartbeat(classId: string): Promise<LiveActionState> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('live_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) {
    return { error: 'Heartbeat fehlgeschlagen.' };
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
