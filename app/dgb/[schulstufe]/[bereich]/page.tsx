import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KOMPETENZBEREICH_INFO, isKompetenzbereich, isSekundarstufe } from '@/lib/curriculum';
import { getTopics, topicSlug } from '@/lib/db/public-content';
import { TileLink } from '@/components/public/TileLink';

export const metadata: Metadata = {
  title: 'Themen — Digitale Grundbildung',
};

export default async function BereichPage({
  params,
}: {
  params: Promise<{ schulstufe: string; bereich: string }>;
}) {
  const { schulstufe, bereich } = await params;
  const stufe = Number(schulstufe);
  if (!isSekundarstufe(stufe) || !isKompetenzbereich(bereich)) {
    notFound();
  }

  const topics = await getTopics(stufe, bereich);
  const info = KOMPETENZBEREICH_INFO[bereich];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <nav className="text-muted-foreground text-sm">
        <Link href={`/dgb/${stufe}`} className="hover:underline">
          {stufe}. Schulstufe
        </Link>{' '}
        / {info.label}
      </nav>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{info.label}</h1>
        <p className="text-muted-foreground mt-1">{info.description}</p>
      </div>
      {topics.length === 0 ? (
        <p className="text-muted-foreground">
          Für diesen Bereich gibt es in der {stufe}. Schulstufe noch keine Inhalte.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((t) => (
            <TileLink
              key={t.topic}
              href={`/dgb/${stufe}/${bereich}/${topicSlug(t.topic)}`}
              title={t.topic}
              description={`${t.materialCount} Material(ien) · ${t.moduleCount} Modul(e)`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
