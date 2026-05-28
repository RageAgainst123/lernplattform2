import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSekundarstufe } from '@/lib/curriculum';
import { getStufeWithBereiche } from '@/lib/db/public-content-stufe';
import { Breadcrumb } from '@/components/public/Breadcrumb';
import { BereichAccordion } from '@/components/public/BereichAccordion';

export const metadata: Metadata = {
  title: 'Schulstufe — Digitale Grundbildung',
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

  const bereiche = await getStufeWithBereiche(stufe);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <Breadcrumb
        parentHref="/dgb"
        parentLabel="Digitale Grundbildung"
        current={`${stufe}. Schulstufe`}
      />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{stufe}. Schulstufe</h1>
        <p className="text-muted-foreground mt-1">
          Wähle einen Kompetenzbereich. Klicke auf ein Thema, um Arbeitsblätter und Module zu sehen.
        </p>
      </header>
      <BereichAccordion bereiche={bereiche} />
    </div>
  );
}
