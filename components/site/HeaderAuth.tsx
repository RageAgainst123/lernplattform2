import Link from 'next/link';
import { getUser } from '@/lib/auth/teacher-auth';
import { getStudentSession } from '@/lib/auth/student-auth';
import { isAdmin } from '@/lib/auth/admin-auth';
import { getCodenameById } from '@/lib/db/student-login';
import { signOut } from '@/lib/auth/actions';
import { studentLogout } from '@/lib/auth/student-actions';
import { buttonVariants } from '@/components/ui/button';

// Server-Komponente: ermittelt den aktuellen Login-Status (Lehrer:in,
// Schüler:in oder ausgeloggt) und rendert den rechten Bereich des Headers
// entsprechend. Eingeloggt: Status + Abmelden. Ausgeloggt: Lehrer:in-Login-CTA.

export type AuthSlotInfo = {
  userLabel: string | null;
  userKind: 'teacher' | 'student' | null;
  isAdminUser: boolean;
};

// Helper: Email auf max 24 Zeichen kürzen (mit „…").
function shortEmail(email: string): string {
  return email.length <= 24 ? email : email.slice(0, 23) + '…';
}

// Datenseite: einmal pro Request ermitteln, wer eingeloggt ist.
export async function fetchAuthSlot(): Promise<AuthSlotInfo> {
  const [user, session] = await Promise.all([getUser(), getStudentSession()]);
  if (user) {
    return {
      userLabel: user.email ? shortEmail(user.email) : 'Lehrer:in',
      userKind: 'teacher',
      isAdminUser: isAdmin(user.email),
    };
  }
  if (session) {
    const codename = await getCodenameById(session.studentCodeId);
    return {
      userLabel: codename ?? 'Schüler:in',
      userKind: 'student',
      isAdminUser: false,
    };
  }
  return { userLabel: null, userKind: null, isAdminUser: false };
}

// Logout-Form (mit Server-Action). Klein, sekundärer Button.
function LogoutForm({ kind }: { kind: 'teacher' | 'student' }) {
  const action = kind === 'teacher' ? signOut : studentLogout;
  return (
    <form action={action}>
      <button type="submit" className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm">
        Abmelden
      </button>
    </form>
  );
}

// Eingeloggter Zustand für Desktop. Zeigt Status + Abmelden, bei Admins
// zusätzlich einen kleinen „Admin"-Link.
function LoggedInSlot({ info }: { info: AuthSlotInfo }) {
  return (
    <div className="hidden items-center gap-3 md:flex">
      {info.isAdminUser && (
        <Link href="/admin" className="text-primary text-sm hover:underline">
          Admin
        </Link>
      )}
      <span className="text-muted-foreground text-sm">
        {info.userKind === 'student' ? 'Angemeldet als ' : ''}
        <strong className="text-foreground">{info.userLabel}</strong>
      </span>
      <LogoutForm kind={info.userKind!} />
    </div>
  );
}

// Ausgeloggter Zustand für Desktop. Zeigt Lehrer:innen-Login-CTA (wie heute).
function LoggedOutSlot() {
  return (
    <Link
      href="/login"
      className={`${buttonVariants({ variant: 'outline' })} hidden md:inline-flex`}
    >
      Lehrer:innen-Login
    </Link>
  );
}

// Desktop-Slot (Mobile wird über MobileMenu bedient — der bekommt die Daten
// als Props vom Eltern-Header).
export function HeaderAuthDesktop({ info }: { info: AuthSlotInfo }) {
  if (info.userLabel) return <LoggedInSlot info={info} />;
  return <LoggedOutSlot />;
}
