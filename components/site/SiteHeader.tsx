import Link from 'next/link';
import { Logo } from '@/components/site/Logo';
import { MobileMenu, type NavLink } from '@/components/site/MobileMenu';
import { HeaderAuthDesktop, fetchAuthSlot } from '@/components/site/HeaderAuth';

// Globaler Header für die gesamte Plattform. Server-Komponente (nur
// das Mobile-Menü ist client). Sticky-Top mit dezenter Blur-Glasoptik.
// Der rechte Slot zeigt entweder eingeloggte:r Name + Abmelden, oder den
// Lehrer:innen-Login-Button (siehe HeaderAuth).

const NAV_LINKS: NavLink[] = [
  { href: '/dgb', label: 'Materialien' },
  { href: '/k', label: 'Schüler:innen-Login' },
];

export async function SiteHeader() {
  const info = await fetchAuthSlot();

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
          <div className="ml-2">
            <HeaderAuthDesktop info={info} />
          </div>
        </nav>

        <MobileMenu
          navLinks={NAV_LINKS}
          userLabel={info.userLabel}
          userKind={info.userKind}
          isAdminUser={info.isAdminUser}
        />
      </div>
    </header>
  );
}
