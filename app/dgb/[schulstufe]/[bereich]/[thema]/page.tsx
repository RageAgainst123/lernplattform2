import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KOMPETENZBEREICH_INFO, isKompetenzbereich, isSekundarstufe } from '@/lib/curriculum';
import { getMaterials, getPublicModules, getTopics, topicSlug } from '@/lib/db/public-content';
import { MaterialItem } from '@/components/public/MaterialItem';
import { PublicModuleItem } from '@/components/public/PublicModuleItem';
import { ContentSection } from '@/components/public/ContentSection';
import { Breadcrumb } from '@/components/public/Breadcrumb';

export const metadata: Metadata = {
  title: 'Thema — Digitale Grundbildung',
};

export default async function ThemaPage({
  params,
}: {
  params: Promise<{ schulstufe: string; bereich: string; thema: string }>;
}) {
  const { schulstufe, bereich, thema } = await params;
  const stufe = Number(schulstufe);
  if (!isSekundarstufe(stufe) || !isKompetenzbereich(bereich)) {
    notFound();
  }

  const topics = await getTopics(stufe, bereich);
  const topic = topics.find((t) => topicSlug(t.topic) === decodeURIComponent(thema))?.topic;
  if (!topic) {
    notFound();
  }

  const [materials, modules] = await Promise.all([
    getMaterials(stufe, bereich, topic),
    getPublicModules(stufe, bereich, topic),
  ]);
  const info = KOMPETENZBEREICH_INFO[bereich];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <Breadcrumb
        parentHref={`/dgb/${stufe}/${bereich}`}
        parentLabel={info.label}
        current={topic}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{topic}</h1>

      <ContentSection
        title="Materialien"
        isEmpty={materials.length === 0}
        emptyText="Noch keine Materialien."
      >
        {materials.map((m) => (
          <MaterialItem key={m.id} material={m} />
        ))}
      </ContentSection>

      <ContentSection title="Module" isEmpty={modules.length === 0} emptyText="Noch keine Module.">
        {modules.map((m) => (
          <PublicModuleItem key={m.id} module={m} />
        ))}
      </ContentSection>
    </main>
  );
}
