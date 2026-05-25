import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase-Client für Server Components, Server Actions und Route Handlers.
// cookies() ist in Next.js 16 asynchron und muss awaited werden.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Aufruf aus einer Server Component: Cookie-Writes sind hier nicht
            // erlaubt. Das ist erwartet — die Middleware übernimmt den Token-Refresh.
          }
        },
      },
    }
  );
}
