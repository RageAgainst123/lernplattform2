import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Legacy-Permalinks der vormals 3- und 4-Ebenen-Navigation auf das neue
// 2-Ebenen-Schema mit Hash umleiten. Die Stufen-Seite (/dgb/[stufe]) hostet
// jetzt alle Bereiche + Themen aufklappbar. Hash-Format: #bereich oder
// #bereich/thema (siehe components/public/useNestedHashAccordion.ts).

// /dgb/[stufe]/[bereich]/[slug] → /dgb/[stufe]#[bereich]/[slug]
const LEGACY_TOPIC_PATH = /^\/dgb\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
// /dgb/[stufe]/[bereich] → /dgb/[stufe]#[bereich]
const LEGACY_BEREICH_PATH = /^\/dgb\/([^/]+)\/([^/]+)\/?$/;

function redirectWithHash(request: NextRequest, pathname: string, hash: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  url.hash = hash;
  return NextResponse.redirect(url, 308);
}

function legacyTopicRedirect(request: NextRequest): NextResponse | null {
  const match = LEGACY_TOPIC_PATH.exec(request.nextUrl.pathname);
  if (!match) return null;
  const [, stufe, bereich, slug] = match;
  return redirectWithHash(request, `/dgb/${stufe}`, `${bereich}/${slug}`);
}

function legacyBereichRedirect(request: NextRequest): NextResponse | null {
  const match = LEGACY_BEREICH_PATH.exec(request.nextUrl.pathname);
  if (!match) return null;
  const [, stufe, bereich] = match;
  return redirectWithHash(request, `/dgb/${stufe}`, bereich);
}

// Next.js 16 File-Convention: "proxy" (ersetzt das deprecated "middleware").
// Läuft vor dem Rendering — hier: Legacy-Permalink-Redirects + Supabase-Auth-Refresh.
// Reihenfolge wichtig: erst der spezifischere 4-Segment-Match, dann der 3-Segment.
export async function proxy(request: NextRequest) {
  const topicRedirect = legacyTopicRedirect(request);
  if (topicRedirect) return topicRedirect;
  const bereichRedirect = legacyBereichRedirect(request);
  if (bereichRedirect) return bereichRedirect;
  return updateSession(request);
}

export const config = {
  matcher: [
    // Alle Pfade außer statischen Assets, Next.js-Internals UND den Polling-
    // Endpunkten (`/api/live`, `/api/quiz`). Beide werden alle paar Sekunden
    // von Schüler:innen/Lehrer:innen-Geräten gepollt — würde es durch
    // updateSession() laufen, liefe pro Poll ein Supabase-Cookie-Refresh
    // (unnötige Last). Die Handler prüfen ihre Auth (jose-/User-Session)
    // selbst.
    '/((?!_next/static|_next/image|favicon.ico|api/live|api/quiz|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
