import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Alte Permalinks `/dgb/[stufe]/[bereich]/[slug]` → neue Hash-Permalinks
// `/dgb/[stufe]/[bereich]#[slug]`. Die Themen-Detailseite gibt es nicht mehr
// — Inhalt klappt auf der Bereich-Seite im Accordion auf.
// Weniger als 6 Pfad-Segmente: kein Match. Slug darf [-a-z0-9]+ enthalten.
const LEGACY_TOPIC_PATH = /^\/dgb\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;

function legacyTopicRedirect(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  const match = LEGACY_TOPIC_PATH.exec(path);
  if (!match) return null;
  const [, stufe, bereich, slug] = match;
  const url = request.nextUrl.clone();
  url.pathname = `/dgb/${stufe}/${bereich}`;
  url.hash = slug;
  return NextResponse.redirect(url, 308);
}

// Next.js 16 File-Convention: "proxy" (ersetzt das deprecated "middleware").
// Läuft vor dem Rendering — hier: Legacy-Permalink-Redirect + Supabase-Auth-Refresh.
export async function proxy(request: NextRequest) {
  const redirect = legacyTopicRedirect(request);
  if (redirect) return redirect;
  return updateSession(request);
}

export const config = {
  matcher: [
    // Alle Pfade außer statischen Assets und Next.js-Internals.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
