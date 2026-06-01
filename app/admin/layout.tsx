import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { BRAND } from '@/lib/brand';
import { ACTIVITY_INFO, MATERIAL_AS_ACTIVITY } from '@/lib/activities';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

// Vier Nav-Einträge: Übersicht + 3 Aktivitäts-Listen. Labels + URLs + Emojis
// kommen aus lib/activities.ts (Single Source of Truth). Aktive Route bekommt
// im Client (AdminNav) eine visuelle Hervorhebung — usePathname() funktioniert
// nur in Client Components.
const NAV = [
  { href: '/admin', label: 'Übersicht', emoji: '🏠' },
  // Themen sind ab Phase G der empfohlene Einstiegspunkt — sie bündeln
  // Lernmodule + Präsentationen + Quiz + Abschlusstest zu einem Lernpfad.
  { href: '/admin/themen', label: 'Themen', emoji: '📚' },
  {
    href: '/admin/lernmodule',
    label: ACTIVITY_INFO.lernmodul.plural,
    emoji: ACTIVITY_INFO.lernmodul.iconEmoji,
  },
  {
    href: '/admin/praesentationen',
    label: ACTIVITY_INFO.praesentation.plural,
    emoji: ACTIVITY_INFO.praesentation.iconEmoji,
  },
  {
    href: '/admin/material',
    label: MATERIAL_AS_ACTIVITY.plural,
    emoji: MATERIAL_AS_ACTIVITY.iconEmoji,
  },
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
        <AdminNav items={NAV} />
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
