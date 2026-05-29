'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';
import { studentLogout } from '@/lib/auth/student-actions';

// Aufklappbares Mobile-Menü (< md). Bewusst kein Sheet — minimal,
// Touch-tauglich (48px). Schließt sich beim Klick auf einen Eintrag
// (kein useEffect-Trick auf pathname-Change nötig).
//
// Auth-Bereich:
//  - Eingeloggt: „Angemeldet als …" + Abmelden-Form (+ Admin-Link bei
//    Lehrer:in mit Admin-Rolle)
//  - Ausgeloggt: Lehrer:innen-Login-CTA wie bisher

export type NavLink = { href: string; label: string };

type UserKind = 'teacher' | 'student' | null;

function MobileLogoutForm({ kind, onClose }: { kind: 'teacher' | 'student'; onClose: () => void }) {
  const action = kind === 'teacher' ? signOut : studentLogout;
  return (
    <form action={action} onSubmit={onClose}>
      <button type="submit" className="hover:bg-muted w-full rounded-md border px-3 py-3 text-base">
        Abmelden
      </button>
    </form>
  );
}

function MobileAuthBlock({
  userLabel,
  userKind,
  isAdminUser,
  onClose,
}: {
  userLabel: string | null;
  userKind: UserKind;
  isAdminUser: boolean;
  onClose: () => void;
}) {
  if (userLabel && userKind) {
    return (
      <div className="mt-2 flex flex-col gap-2 border-t pt-3">
        <p className="text-muted-foreground px-3 text-sm">
          Angemeldet als <strong className="text-foreground">{userLabel}</strong>
        </p>
        {isAdminUser && (
          <Link
            href="/admin"
            onClick={onClose}
            className="text-primary hover:bg-muted rounded-md px-3 py-3 text-base"
          >
            Admin
          </Link>
        )}
        <MobileLogoutForm kind={userKind} onClose={onClose} />
      </div>
    );
  }
  return (
    <Link
      href="/login"
      onClick={onClose}
      className={`${buttonVariants({ variant: 'outline' })} mt-2 justify-center`}
    >
      Lehrer:innen-Login
    </Link>
  );
}

function MenuPanel({
  navLinks,
  userLabel,
  userKind,
  isAdminUser,
  onClose,
}: {
  navLinks: NavLink[];
  userLabel: string | null;
  userKind: UserKind;
  isAdminUser: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id="mobile-menu"
      className="bg-background absolute inset-x-0 top-16 z-30 border-b p-4 shadow-sm"
    >
      <nav className="flex flex-col gap-1" aria-label="Hauptnavigation mobil">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="hover:bg-muted rounded-md px-3 py-3 text-base"
          >
            {l.label}
          </Link>
        ))}
        <MobileAuthBlock
          userLabel={userLabel}
          userKind={userKind}
          isAdminUser={isAdminUser}
          onClose={onClose}
        />
      </nav>
    </div>
  );
}

export function MobileMenu({
  navLinks,
  userLabel,
  userKind,
  isAdminUser,
}: {
  navLinks: NavLink[];
  userLabel: string | null;
  userKind: UserKind;
  isAdminUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-md"
      >
        {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>
      {open && (
        <MenuPanel
          navLinks={navLinks}
          userLabel={userLabel}
          userKind={userKind}
          isAdminUser={isAdminUser}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
