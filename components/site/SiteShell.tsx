import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

// Globaler Layout-Wrapper: Header + Hauptinhalt + Footer. Jede Page rendert
// nur noch eine `<div>` (kein eigenes `<main>` mehr) — die `<main>`-Landmark
// kommt von hier, eine pro Dokument.

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
