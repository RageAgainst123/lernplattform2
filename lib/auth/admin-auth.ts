import 'server-only';
import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { requireUser } from '@/lib/auth/teacher-auth';

// Admin-Erkennung via E-Mail-Allowlist (siehe BRAND.adminEmails).
// Kein DB-Schema-Eingriff. Skaliert für 1-3 Admins. Wenn mehr nötig:
// teachers.is_admin-Spalte ergänzen, Allowlist als Fallback behalten.
// Siehe docs/ROLES.md §4.

// Reine Pure-Funktion, testbar ohne DB. Case-insensitive Vergleich.
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BRAND.adminEmails.some((allowed) => allowed.toLowerCase() === normalized);
}

// Für /admin-Server-Components + Server Actions. Loggt nicht-Admin-Lehrer:innen
// in den /lehrer-Bereich um (statt 403 zu zeigen) — ist freundlicher.
// Nicht-eingeloggte werden bereits von requireUser zu /login geschickt.
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user.email)) {
    redirect('/lehrer');
  }
  return user;
}
