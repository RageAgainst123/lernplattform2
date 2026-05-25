import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refresht das Supabase-Auth-Token bei jedem Request und hält die Cookies
// zwischen Request und Response synchron. Aufgerufen aus dem Root-middleware.ts.
//
// WICHTIG: Das zurückgegebene `supabaseResponse`-Objekt muss unverändert
// weitergereicht werden, sonst bricht die Cookie-Synchronisation.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validiert die Session (JWT) und triggert ggf. den Token-Refresh.
  // getUser() statt getSession() — prüft die Signatur server-seitig.
  await supabase.auth.getUser();

  return supabaseResponse;
}
