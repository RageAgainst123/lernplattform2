import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Lädt den aktuell eingeloggten Lehrer:innen-User. getUser() validiert das JWT
// server-seitig (nicht getSession()). Null, wenn nicht eingeloggt.
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

// Phase Q5: prüft ob der eingeloggte Lehrer:in via Azure-OAuth (= Microsoft
// 365) eingeloggt ist (Identities-Liste enthält azure-Provider). Wichtig für
// das Öffnen von Word-Heften aus fremden Tenants — Magic-Link-Login reicht
// dafür nicht (Microsoft will MS-Auth-Cookie sehen).
export function isAzureLogin(user: User | null): boolean {
  if (!user?.identities) return false;
  return user.identities.some((i) => i.provider === 'azure');
}

// Für geschützte Server Components: gibt den User zurück oder leitet zu /login um.
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

// Legt nach dem ersten Login das teachers-Profil an (idempotent).
// Läuft authentifiziert → RLS-Policy teachers_insert_own (auth.uid() = id) greift.
// Der Name wird aus der E-Mail abgeleitet, bis die Lehrer:in ihn in den
// Einstellungen anpasst.
export async function ensureTeacherProfile(user: User): Promise<void> {
  const supabase = await createClient();
  const email = user.email ?? '';
  const fallbackName = email.split('@')[0] || 'Lehrer:in';

  await supabase
    .from('teachers')
    .upsert(
      { id: user.id, email, name: fallbackName },
      { onConflict: 'id', ignoreDuplicates: true }
    );
}
