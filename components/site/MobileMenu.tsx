'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

// Aufklappbares Mobile-Menü (< md). Bewusst kein Sheet — minimal,
// Touch-tauglich (48px). Schließt sich beim Klick auf einen Eintrag
// (kein useEffect-Trick auf pathname-Change nötig).

export type NavLink = { href: string; label: string };

function MenuPanel({
  navLinks,
  cta,
  onClose,
}: {
  navLinks: NavLink[];
  cta: NavLink;
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
        <Link
          href={cta.href}
          onClick={onClose}
          className={`${buttonVariants({ variant: 'outline' })} mt-2 justify-center`}
        >
          {cta.label}
        </Link>
      </nav>
    </div>
  );
}

export function MobileMenu({ navLinks, cta }: { navLinks: NavLink[]; cta: NavLink }) {
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
      {open && <MenuPanel navLinks={navLinks} cta={cta} onClose={() => setOpen(false)} />}
    </div>
  );
}
