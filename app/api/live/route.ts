import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth/student-auth';
import { getActiveSessionForClass, getActivePollForClass } from '@/lib/db/live-sessions';

// Polling-Endpunkt für die Live-Präsentation. Das Schüler:innen-Gerät fragt hier
// alle paar Sekunden: „Läuft in meiner Klasse gerade eine Präsentation?"
//
// Sicherheit: classId kommt AUSSCHLIESSLICH aus der jose-Session (nie aus einem
// Client-Param) → kein IDOR. Schüler:innen haben kein auth.uid(); das Lesen der
// aktiven Session läuft serverseitig über den Service-Role-Client (folgt in
// Schritt 3). Vorerst liefert der Handler nur den „keine Session"-Zustand.
//
// force-dynamic + no-store: niemals cachen, jede Abfrage frisch.
export const dynamic = 'force-dynamic';

export type LiveState =
  | { active: false }
  | { active: true; interactive: false }
  | {
      active: true;
      interactive: true;
      poll: { blockId: string; question: string; options: { id: string; text: string }[] };
    };

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
  // Nur wenn der aktuelle Block ein live_poll ist, kommt Inhalt (Frage +
  // Optionen) ans Gerät — reine Folien liefern KEIN Modul-Inhalt (nur dimmen).
  const poll = await getActivePollForClass(live);
  if (!poll) {
    return noStore({ active: true, interactive: false });
  }
  return noStore({ active: true, interactive: true, poll });
}
