import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { ACTIVITY_INFO, MATERIAL_AS_ACTIVITY } from '@/lib/activities';
import { AdminShell } from '@/components/admin/AdminShell';

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
    href: '/admin/quizze',
    label: ACTIVITY_INFO.quiz.plural,
    emoji: ACTIVITY_INFO.quiz.iconEmoji,
  },
  {
    href: '/admin/abschlusstests',
    label: ACTIVITY_INFO.abschlusstest.plural,
    emoji: ACTIVITY_INFO.abschlusstest.iconEmoji,
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
  // Layout-Hülle (Breite + Sidebar an/aus je nach Route) lebt im Client-Wrapper
  // AdminShell — requireAdmin + NAV-Daten bleiben hier Server-seitig.
  return (
    <AdminShell nav={NAV} email={user.email ?? ''}>
      {children}
    </AdminShell>
  );
}
