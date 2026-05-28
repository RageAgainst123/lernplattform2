import Link from 'next/link';
import { Logo } from '@/components/site/Logo';
import { BRAND } from '@/lib/brand';

// Globaler Footer mit drei Spalten auf Desktop, einspaltig auf Mobile.
// Trägt die DSGVO-relevanten Links und den Hosting-Hinweis.

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
      <div className="text-muted-foreground space-y-2 text-sm">{children}</div>
    </div>
  );
}

const linkClass = 'hover:text-foreground block py-1';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-muted/30 mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterColumn title="Über">
            <Logo iconClassName="size-6" textClassName="text-sm font-semibold" />
            <p className="pt-1">{BRAND.tagline}</p>
            <a href={BRAND.github} className={linkClass} target="_blank" rel="noreferrer">
              Open Source auf GitHub →
            </a>
          </FooterColumn>

          <FooterColumn title="Rechtliches">
            <Link href="/impressum" className={linkClass}>
              Impressum
            </Link>
            <Link href="/datenschutz" className={linkClass}>
              Datenschutz
            </Link>
          </FooterColumn>

          <FooterColumn title="Kontakt">
            <a href={`mailto:${BRAND.contactEmail}`} className={linkClass}>
              {BRAND.contactEmail}
            </a>
            <p>Österreich · Hosting in {BRAND.hostingRegion}</p>
          </FooterColumn>
        </div>

        <div className="text-muted-foreground mt-8 border-t pt-6 text-center text-xs">
          © {year} {BRAND.name} · DSGVO-konform · Verarbeitung ausschließlich in der EU
        </div>
      </div>
    </footer>
  );
}
