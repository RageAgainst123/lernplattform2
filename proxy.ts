import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Next.js 16 File-Convention: "proxy" (ersetzt das deprecated "middleware").
// Läuft vor dem Rendering — hier: Supabase-Auth-Token-Refresh.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Alle Pfade außer statischen Assets und Next.js-Internals.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
