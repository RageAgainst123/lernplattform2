import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { getVoteAggregate } from '@/lib/db/live-sessions';
import { countPresence, countVoters } from '@/lib/db/live-presence';

// GET /api/live/results?classId=…&blockId=…
// Lehrer:innen-Polling-Endpunkt für den Beamer (Phase B/C). Lieferte vorher die
// Server Action getLiveResults — die wird im Dev-Mode aber bei jedem Aufruf vom
// Next-16-"Rendering..."-Overlay erfasst und triggert Server-Action-Overhead
// (Form-State, Action-ID). Bei 1-2 s-Polling über Minuten wird das zur Last.
// API-Route ist semantisch korrekt (Read-only Polling, kein Mutation),
// schneller (kein Server-Action-Wrapper) und triggert den Dev-Indicator nicht.
//
// Sicherheit: requireUser + RLS (live_sessions only_own). classId/blockId
// kommen aus Query-Params, aber RLS schützt vor IDOR — nur eigene Sessions
// sind sichtbar.
export const dynamic = 'force-dynamic';

export type ResultsResponse = {
  counts: Record<string, number>;
  revealed: boolean;
  locked: boolean;
  present: number;
  voters: number;
};

function noStore(body: ResultsResponse): NextResponse {
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}

const EMPTY: ResultsResponse = {
  counts: {},
  revealed: false,
  locked: false,
  present: 0,
  voters: 0,
};

export async function GET(req: Request) {
  await requireUser();
  const url = new URL(req.url);
  const classId = url.searchParams.get('classId');
  const blockId = url.searchParams.get('blockId');
  if (!classId || !blockId) {
    return NextResponse.json({ error: 'classId und blockId nötig' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('id, current_block_revealed, current_block_locked')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) return noStore(EMPTY);
  const [counts, present, voters] = await Promise.all([
    getVoteAggregate(data.id, blockId),
    countPresence(data.id),
    countVoters(data.id, blockId),
  ]);
  return noStore({
    counts,
    revealed: data.current_block_revealed as boolean,
    locked: data.current_block_locked as boolean,
    present,
    voters,
  });
}
