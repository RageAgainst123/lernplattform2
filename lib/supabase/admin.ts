import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Supabase-Client mit Service-Role-Key — umgeht RLS. AUSSCHLIESSLICH server-seitig
// für Schüler:innen-Operationen (Code+PIN-Login, Fortschritt), die kein
// auth.uid() haben. Der Zugriff wird durch Application Logic class-scoped
// abgesichert. Niemals im Client importieren ('server-only' erzwingt das).
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error('SUPABASE_SECRET_KEY oder URL fehlt (server-only).');
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
