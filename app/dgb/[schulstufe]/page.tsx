import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KOMPETENZBEREICHE, KOMPETENZBEREICH_INFO, isSekundarstufe } from '@/lib/curriculum';
import { TileLink } from '@/components/public/TileLink';

export const metadata: Metadata = {
  title: 'Kompetenzbereiche — Digitale Grundbildung',
};

export default async function SchulstufePage({
  params,
}: {
  params: Promise<{ schulstufe: string }>;
}) {
  const { schulstufe } = await params;
  const stufe = Number(schulstufe);
  if (!Number.isInteger(stufe) || !isSekundarstufe(stufe)) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <nav className="text-muted-foreground text-sm">
        <Link href="/dgb" className="hover:underline">
          Digitale Grundbildung
        </Link>{' '}
        / {stufe}. Schulstufe
      </nav>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{stufe}. Schulstufe</h1>
        <p className="text-muted-foreground mt-1">Wähle einen Kompetenzbereich.</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {KOMPETENZBEREICHE.map((bereich) => (
          <TileLink
            key={bereich}
            href={`/dgb/${stufe}/${bereich}`}
            title={KOMPETENZBEREICH_INFO[bereich].label}
            description={KOMPETENZBEREICH_INFO[bereich].description}
          />
        ))}
      </div>
    </main>
  );
}
