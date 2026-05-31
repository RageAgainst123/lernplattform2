import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth/student-auth';
import {
  getActiveSessionForClass,
  getActivePollForClass,
  type LiveInteraction,
} from '@/lib/db/live-sessions';
import { touchPresence } from '@/lib/db/live-presence';

// Polling-Endpunkt für die Live-Präsentation. Das Schüler:innen-Gerät fragt hier
// alle paar Sekunden: „Läuft in meiner Klasse gerade eine Präsentation?"
//
// Sicherheit: classId kommt AUSSCHLIESSLICH aus der jose-Session (nie aus einem
// Client-Param) → kein IDOR. Schüler:innen haben kein auth.uid(); das Lesen der
// aktiven Session läuft serverseitig über den Service-Role-Client.
//
// force-dynamic + no-store: niemals cachen, jede Abfrage frisch.
export const dynamic = 'force-dynamic';

// LiveInteraction + locked — das bekommt das Kind-Gerät. correct-Flags sind
// niemals drin (werden in getActivePollForClass entfernt).
export type LiveInteractionState = LiveInteraction & { locked: boolean };

export type LiveState =
  | { active: false }
  | { active: true; interactive: false }
  | { active: true; interactive: true; interaction: LiveInteractionState };

function noStore(state: LiveState): NextResponse {
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return noStore({ active: false });
  }
  const live = await getActiveSessionForClass(session.classId);
  if (!live) {
    return noStore({ active: false });
  }
  // Präsenz-Heartbeat: Kind gilt als „aktiv" solange es pollt (last_seen frisch).
  // Fire-and-forget: kein await — Fehler hier sollen den Poll-Response nie blockieren.
  void touchPresence(live.id, session.studentCodeId);

  // Nur wenn der aktuelle Block interaktiv ist, kommt Inhalt ans Gerät.
  // Reine Folien liefern KEIN Modul-Inhalt — nur Dimm-Overlay.
  const interaction = await getActivePollForClass(live);
  if (!interaction) {
    return noStore({ active: true, interactive: false });
  }
  return noStore({
    active: true,
    interactive: true,
    interaction: { ...interaction, locked: live.locked },
  });
}
