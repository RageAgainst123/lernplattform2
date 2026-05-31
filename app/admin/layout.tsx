import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

// Drei Aktivitäten + Übersicht (Phase E). Sprache und URL-Segmente kommen aus
// lib/activities.ts — wenn sich da was ändert, hier ebenfalls anpassen.
const NAV = [
  { href: '/admin', label: 'Übersicht' },
  { href: '/admin/lernmodule', label: 'Lernmodule' },
  { href: '/admin/praesentationen', label: 'Präsentationen' },
  { href: '/admin/material', label: 'Arbeitsblätter' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:flex md:gap-8">
      <aside className="md:w-56 md:shrink-0">
        <div className="mb-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Admin</p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
        <nav
          className="flex flex-row gap-2 overflow-x-auto md:flex-col"
          aria-label="Admin-Navigation"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hover:bg-muted shrink-0 rounded-md px-3 py-2 text-sm"
            >
              {n.label}
            </Link>
          ))}
        </nav>
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
