'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { isEditorRoute } from '@/lib/admin/is-editor-route';
import { AdminNav, type AdminNavItem } from '@/components/admin/AdminNav';

// Layout-Hülle für den Admin-Bereich. Erkennt per Pfad, ob die aktuelle Seite
// eine Modul-Editor-Route ist: dann wird der Editor breit (max-w-screen-2xl)
// und OHNE Admin-Sidebar dargestellt — maximale Arbeitsfläche fürs Bearbeiten.
// Alle anderen Admin-Seiten bleiben schmal (max-w-6xl) mit Sidebar.
//
// Client-Komponente nur wegen usePathname(); requireAdmin + NAV-Daten kommen
// aus dem Server-Layout (app/admin/layout.tsx) als Props.

export function AdminShell({
  nav,
  email,
  children,
}: {
  nav: AdminNavItem[];
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isEditorRoute(pathname)) {
    return <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:flex md:gap-8">
      <aside className="md:w-56 md:shrink-0">
        <div className="mb-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Admin</p>
          <p className="text-sm font-medium">{email}</p>
        </div>
        <AdminNav items={nav} />
        <div className="text-muted-foreground mt-6 hidden text-xs md:block">
          <p>Du bist als Admin von {BRAND.name} angemeldet.</p>
          <p className="mt-2">
            <Link href="/lehrer" className="hover:underline">
              ← Zurück zum Lehrer:innen-Bereich
            </Link>
          </p>
        </div>
      </aside>
      <div className="mt-6 flex-1 md:mt-0">{children}</div>
    </div>
  );
}
