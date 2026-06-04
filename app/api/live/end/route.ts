import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/teacher-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { rateLimitGate } from '@/lib/rate-limit';

// POST /api/live/end — wird vom Beamer via fetch({keepalive:true}) beim
// beforeunload-Event aufgerufen. Hält die Verbindung auch nach dem Tab-Schließen
// aufrecht und beendet die aktive Session der Klasse.
//
// PRE-LAUNCH-AUDIT CRIT-1 (2026-06-04): vorher anonym aufrufbar — Angreifer
// konnte jede Live-Session einer beliebigen classId beenden. Jetzt: Lehrer-
// Auth-Pflicht + classId muss eigene Klasse sein.
//
// keepalive + same-origin POST sendet Cookies mit (Browser-Standard). Falls
// in seltenen Fällen Cookies fehlen (z.B. SameSite-strict-quirks), returnt der
// Endpoint 401 — und der 60-s-Heartbeat-Tod in getActiveSessionForClass räumt
// die Session ohnehin auf.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const blocked = rateLimitGate(req, 'live-end');
  if (blocked) return blocked;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let classId: string | undefined;
  try {
    const body = (await req.json()) as { classId?: string };
    classId = typeof body.classId === 'string' ? body.classId : undefined;
  } catch {
    // Body leer oder kein JSON (Edge-Case bei keepalive)
  }

  if (!classId) {
    return NextResponse.json({ ok: false, error: 'classId required' }, { status: 400 });
  }

  // Owner-Check: classId muss zu einer Klasse des eingeloggten Lehrers gehören.
  // Service-Role nur fuer den Lookup + Update (Lehrer-Client + RLS waere
  // sauberer, aber keepalive-Cookies sind Edge-Case-zickig; lieber ein
  // expliziter Owner-Check.
  const supabase = createServiceClient();
  const { data: cls } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .maybeSingle();
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  await supabase
    .from('live_sessions')
    .update({ status: 'ended' })
    .eq('class_id', classId)
    .eq('status', 'active');

  return NextResponse.json({ ok: true });
}
