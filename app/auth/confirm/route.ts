import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureTeacherProfile } from '@/lib/auth/teacher-auth';
import { clearStudentSession } from '@/lib/auth/session-cleanup';

// Verarbeitet den Magic-Link-Klick aus der E-Mail (token_hash + type).
// Bei Erfolg: Session gesetzt, teachers-Profil angelegt, Weiterleitung ins
// Dashboard.

const FALLBACK = '/lehrer';

// Sichert den `next`-Param ab: nur relative App-interne Pfade sind erlaubt.
// Verhindert klassische Open-Redirect-Angriffe via Magic-Link:
//   - `?next=https://evil.com`  (absolute URL)
//   - `?next=//evil.com`        (protokoll-relativ — beginnt mit `/`, ist extern)
//   - `?next=/\evil.com`        (Backslash — Browser/WHATWG-URL machen `\`→`/`,
//                                löst zu https://evil.com auf)
//   - `?next=/<tab>/evil.com`   (Control-Char-Smuggling: Parser entfernt \t,\n,\r)
// Strategie: Backslash explizit verbieten, dann gegen eine feste Dummy-Origin
// auflösen und prüfen, dass das Ergebnis WIRKLICH auf dieser Origin bleibt
// (kein Host-Wechsel). Die URL-Prüfung fängt auch Control-Char-Smuggling.
// Siehe ADR-0009.
export function safeNext(raw: string | null): string {
  if (!raw) return FALLBACK;
  // Muss ein relativer Pfad sein (genau ein führender Slash).
  if (!raw.startsWith('/') || raw.startsWith('//')) return FALLBACK;
  // Backslash verbieten: `/\evil.com` beginnt mit einem `/`, wird aber von
  // WHATWG-URL zu `//evil.com` normalisiert → externer Host. Explizit (und
  // ASCII-sauber) abfangen.
  if (raw.includes('\\')) return FALLBACK;
  // Schlussprüfung als eigentliche Garantie: gegen eine feste Dummy-Origin
  // auflösen und sicherstellen, dass kein Host-Wechsel passiert ist. Fängt auch
  // Control-Char-Smuggling (Tab/Newline werden vom Parser entfernt → //evil.com
  // → fremder Host → Fallback).
  try {
    const url = new URL(raw, 'https://internal.invalid');
    if (url.origin !== 'https://internal.invalid') return FALLBACK;
    return url.pathname + url.search + url.hash;
  } catch {
    return FALLBACK;
  }
}

// Nach erfolgreich gesetzter Session: Profil anlegen, Schüler-Session löschen,
// zum Ziel weiterleiten. Gemeinsamer Pfad für Magic-Link UND OAuth-Login.
async function finalizeTeacherLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  request: NextRequest,
  next: string
): Promise<NextResponse> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.redirect(new URL('/login?error=profil_fehler', request.url));
    }
    await ensureTeacherProfile(user);
    // Falls parallel eine Schüler:innen-Session existiert: beenden.
    await clearStudentSession();
  } catch {
    return NextResponse.redirect(new URL('/login?error=profil_fehler', request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  // Phase O5: OAuth-Code aus Microsoft-Login. Magic-Link nutzt token_hash,
  // OAuth nutzt code. Beide enden im selben Confirm-Endpoint.
  const oauthCode = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // Magic-Link-Pfad (token_hash + type)
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return finalizeTeacherLogin(supabase, request, next);
    }
    return NextResponse.redirect(new URL('/login?error=link_ungueltig', request.url));
  }

  // OAuth-Pfad (Microsoft / Azure): ?code=…
  if (oauthCode) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(oauthCode);
    if (!error) {
      return finalizeTeacherLogin(supabase, request, next);
    }
    return NextResponse.redirect(new URL('/login?error=oauth_fehler', request.url));
  }

  return NextResponse.redirect(new URL('/login?error=link_ungueltig', request.url));
}
