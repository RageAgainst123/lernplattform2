import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KOMPETENZBEREICH_INFO, isKompetenzbereich, isSekundarstufe } from '@/lib/curriculum';
import { getBereichWithTopics } from '@/lib/db/public-content';
import { Breadcrumb } from '@/components/public/Breadcrumb';
import { ThemaAccordion } from '@/components/public/ThemaAccordion';

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

  const topics = await getBereichWithTopics(stufe, bereich);
  const info = KOMPETENZBEREICH_INFO[bereich];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <Breadcrumb
        parentHref={`/dgb/${stufe}`}
        parentLabel={`${stufe}. Schulstufe`}
        current={info.label}
      />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{info.label}</h1>
        <p className="text-muted-foreground mt-1">{info.description}</p>
      </header>
      {topics.length === 0 ? (
        <p className="text-muted-foreground">
          Für diesen Bereich gibt es in der {stufe}. Schulstufe noch keine Inhalte.
        </p>
      ) : (
        <ThemaAccordion topics={topics} />
      )}
    </main>
  );
}
