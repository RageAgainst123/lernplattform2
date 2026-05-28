import Link from 'next/link';
import { Logo } from '@/components/site/Logo';
import { MobileMenu, type NavLink } from '@/components/site/MobileMenu';
import { buttonVariants } from '@/components/ui/button';

// Globaler Header für die gesamte Plattform. Server-Komponente (nur
// das Mobile-Menü ist client). Sticky-Top mit dezenter Blur-Glasoptik.

const NAV_LINKS: NavLink[] = [
  { href: '/dgb', label: 'Materialien' },
  { href: '/k', label: 'Schüler:innen-Login' },
];

const CTA: NavLink = { href: '/login', label: 'Lehrer:innen-Login' };

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:bg-muted rounded-md px-3 py-2 text-sm"
            >
              {l.label}
            </Link>
          ))}
          <Link href={CTA.href} className={`${buttonVariants({ variant: 'outline' })} ml-2`}>
            {CTA.label}
          </Link>
        </nav>

        <MobileMenu navLinks={NAV_LINKS} cta={CTA} />
      </div>
    </header>
  );
}
