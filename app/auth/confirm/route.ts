import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureTeacherProfile } from '@/lib/auth/teacher-auth';
import { clearStudentSession } from '@/lib/auth/session-cleanup';

// Verarbeitet den Magic-Link-Klick aus der E-Mail (token_hash + type).
// Bei Erfolg: Session gesetzt, teachers-Profil angelegt, Weiterleitung ins Dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/lehrer';

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureTeacherProfile(user);
      }
      // Falls parallel eine Schüler:innen-Session existiert: beenden, damit
      // es nie zwei aktive Rollen-Cookies gleichzeitig gibt (siehe
      // session-cleanup.ts).
      await clearStudentSession();
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=link_ungueltig', request.url));
}
