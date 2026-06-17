import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';

// Health-Endpoint (Pre-Launch-C2, COST-CONTROLS.md M2.5).
//
// Zweck: externes Uptime-Monitoring (Better Stack, UptimeRobot, Cron-Job
// org). Antwortet 200 wenn DB erreichbar + Schema gesund ist, sonst 503.
// Public erreichbar (kein Auth) — kein Geheimnis im Response.
//
// Caching: no-store. Status-Page (/status) holt direkt diesen Endpoint.

export const dynamic = 'force-dynamic';

type HealthState = {
  status: 'ok' | 'degraded';
  ts: string;
  latencyMs: number;
  checks: {
    db: 'ok' | 'fail';
  };
};

async function pingDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    // Leichteste mögliche Query: count head=true auf einer Tabelle die
    // garantiert existiert. Touches kein RLS, kein Schema-Lookup, kein
    // Row-Lock. Bei DB-Down: error gesetzt.
    const { error } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    return { ok: !error, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const db = await pingDb();
  const state: HealthState = {
    status: db.ok ? 'ok' : 'degraded',
    ts: new Date().toISOString(),
    latencyMs: db.latencyMs,
    checks: { db: db.ok ? 'ok' : 'fail' },
  };
  return NextResponse.json(state, {
    status: state.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
