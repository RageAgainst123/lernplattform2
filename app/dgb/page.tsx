import type { Metadata } from 'next';
import Link from 'next/link';
import { SEKUNDARSTUFE } from '@/lib/curriculum';
import { TileLink } from '@/components/public/TileLink';

export const metadata: Metadata = {
  title: 'Digitale Grundbildung — Schulstufen',
};

export default function DgbPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <nav className="text-muted-foreground text-sm">
        <Link href="/" className="hover:underline">
          Start
        </Link>{' '}
        / Digitale Grundbildung
      </nav>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sekundarstufe I</h1>
        <p className="text-muted-foreground mt-1">
          Wähle eine Schulstufe. Die Inhalte sind aufbauend nach Kompetenzbereichen geordnet.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {SEKUNDARSTUFE.map((stufe) => (
          <TileLink
            key={stufe}
            href={`/dgb/${stufe}`}
            title={`${stufe}. Schulstufe`}
            description={`Alle Themen der ${stufe}. Schulstufe`}
          />
        ))}
      </div>
    </div>
  );
}
