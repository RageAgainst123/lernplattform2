import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/teacher-auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { rateLimitGate } from '@/lib/rate-limit';

// GET /api/live/wordcloud?classId=…&blockId=…
// Lehrer:innen-Polling-Endpunkt für den WordCloud-Beamer. Wie /api/live/results:
// API-Route statt Server Action — kein Dev-Mode-"Rendering..."-Overlay, kein
// Server-Action-Wrapper-Overhead. Aggregiert free_text-Stimmen serverseitig
// (case-insensitiv, top 50). Sicherheit über requireUser + Service-Role-Aggregation.
export const dynamic = 'force-dynamic';

export type WordCloudResponse = { word: string; count: number }[];

function noStore(body: WordCloudResponse): NextResponse {
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req: Request) {
  const blocked = rateLimitGate(req, 'live-wordcloud');
  if (blocked) return blocked;
  await requireUser();
  const url = new URL(req.url);
  const classId = url.searchParams.get('classId');
  const blockId = url.searchParams.get('blockId');
  if (!classId || !blockId) {
    return NextResponse.json({ error: 'classId und blockId nötig' }, { status: 400 });
  }
  const teacher = await createClient();
  const { data: session } = await teacher
    .from('live_sessions')
    .select('id')
    .eq('class_id', classId)
    .eq('status', 'active')
    .maybeSingle();
  if (!session) return noStore([]);
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('live_votes')
    .select('free_text')
    .eq('session_id', session.id)
    .eq('block_id', blockId)
    .not('free_text', 'is', null);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const word = (row.free_text as string).trim().toLowerCase();
    if (word) counts[word] = (counts[word] ?? 0) + 1;
  }
  const result = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));
  return noStore(result);
}
