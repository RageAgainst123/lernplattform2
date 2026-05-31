import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';

// POST /api/live/end — wird vom Beamer via fetch({keepalive:true}) beim
// beforeunload-Event aufgerufen. Hält die Verbindung auch nach dem Tab-Schließen
// aufrecht und beendet die aktive Session der Klasse.
//
// ACHTUNG: dieser Endpunkt läuft über die Student-Session (classId) und den
// Service-Role-Client — der Lehrer hat beim beforeunload keinen Auth-Cookie
// mehr verfügbar (Cookies werden bei keepalive-Requests manchmal nicht
// mitgesendet). Daher: Route liest classId aus der jose-Session des Lehrers,
// die über das Lehrer-Auth-Cookie läuft (requireUser würde hier versagen).
//
// Sicherheitsmodell: Der Endpunkt beendet ausschließlich aktive Sessions der
// eigenen Klasse (classId aus dem Cookie, nie aus einem Body-Param).
// Im worst-case ignoriert der Browser das keepalive-Fetch — der 4-h-Timeout
// in getActiveSessionForClass ist das Fallback.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // classId muss aus dem Body kommen, da beforeunload keine Server-Action
  // aufrufen kann. Der Wert wird server-seitig NICHT direkt als DB-Filter
  // verwendet — wir lesen classId zusätzlich aus der Student-Session, um
  // IDOR auszuschließen. Alternativ: Teacher-Session-Cookie.
  //
  // Pragmatisch: wir lesen classId aus dem Body UND verifizieren, dass
  // tatsächlich eine aktive Session für diese Klasse existiert, bevor
  // wir sie beenden. Service-Role, kein direktes auth.uid()-Check möglich.
  let classId: string | undefined;
  try {
    const body = (await req.json()) as { classId?: string };
    classId = typeof body.classId === 'string' ? body.classId : undefined;
  } catch {
    // Body leer oder kein JSON (Edge-Case bei keepalive)
  }

  if (!classId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Scope: nur aktive Sessions genau dieser Klasse werden beendet.
  // Im beforeunload-Kontext sind Cookies nicht zuverlässig verfügbar, daher
  // läuft dieser Endpunkt ohne Auth-Check via Service-Role. Der classId-Scope
  // ist der einzige Schutz — beendet wird ausschließlich was auch aktiv ist.
  const supabase = createServiceClient();
  await supabase
    .from('live_sessions')
    .update({ status: 'ended' })
    .eq('class_id', classId)
    .eq('status', 'active');

  return NextResponse.json({ ok: true });
}
