import { createBrowserClient } from '@supabase/ssr';

// Supabase-Client für Client Components (Browser).
// Auth-Tokens liegen in HTTP-Only-Cookies (von der Middleware verwaltet),
// nicht im localStorage.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
