import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { STUDENT_COOKIE, verifyStudentSession } from '@/lib/auth/student-session';

// Leitet auf `path` um und überträgt die aktuellen Auth-Cookies, damit der
// Token-Refresh über den Redirect hinweg erhalten bleibt.
function redirectTo(request: NextRequest, path: string, base: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const redirect = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// Schützt /s/* (Schüler:innen): nur mit gültigem Session-Cookie (jose). Sonst zur
// Code-Eingabe /k. Gibt null zurück, wenn kein Eingriff nötig ist.
async function guardStudentArea(
  request: NextRequest,
  base: NextResponse
): Promise<NextResponse | null> {
  if (!request.nextUrl.pathname.startsWith('/s')) {
    return null;
  }
  const token = request.cookies.get(STUDENT_COOKIE)?.value;
  const session = token ? await verifyStudentSession(token) : null;
  return session ? null : redirectTo(request, '/k', base);
}

// Refresht das Auth-Token bei jedem Request, hält die Cookies synchron und
// erzwingt den Zugriffsschutz: /lehrer/* nur eingeloggt, /login nur ausgeloggt.
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

  // getUser() statt getSession() — validiert die JWT-Signatur server-seitig.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const studentRedirect = await guardStudentArea(request, supabaseResponse);
  if (studentRedirect) {
    return studentRedirect;
  }

  const path = request.nextUrl.pathname;
  if (!user && path.startsWith('/lehrer')) {
    return redirectTo(request, '/login', supabaseResponse);
  }
  if (user && path === '/login') {
    return redirectTo(request, '/lehrer', supabaseResponse);
  }

  return supabaseResponse;
}
