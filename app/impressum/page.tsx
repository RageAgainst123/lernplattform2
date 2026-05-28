import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Impressum',
  description: `Impressum der Plattform ${BRAND.name} gemäß §5 ECG und §25 MedienG.`,
};

// Pflichtangaben nach §5 E-Commerce-Gesetz (ECG) Österreich + §25
// Mediengesetz. ACHTUNG: vor Live-Schaltung muss Geo die vollständige
// Postanschrift ergänzen (Platzhalter im SECTIONS-Block).

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Diensteanbieter',
    body: (
      <p>
        Geo Schlegel
        <br />
        [Adresse wird vor Veröffentlichung ergänzt]
        <br />
        Österreich
      </p>
    ),
  },
  {
    title: 'Kontakt',
    body: (
      <p>
        E-Mail:{' '}
        <a className="text-primary hover:underline" href={`mailto:${BRAND.contactEmail}`}>
          {BRAND.contactEmail}
        </a>
      </p>
    ),
  },
  {
    title: 'Tätigkeit',
    body: (
      <p>
        {BRAND.name} ist eine nicht-kommerzielle, offene Lernplattform für die Digitale Grundbildung
        (Sekundarstufe I) in Österreich. Betreiber ist Geo Schlegel als Privatperson; es besteht
        keine Gewerbeberechtigung, keine UID-Nummer und keine Aufsichtsbehörde nach GewO.
      </p>
    ),
  },
  {
    title: 'Verantwortlich nach §25 MedienG',
    body: <p>Geo Schlegel, Anschrift wie oben.</p>,
  },
  {
    title: 'Grundlegende Richtung',
    body: (
      <p>
        Die Plattform stellt Materialien und interaktive Lernmodule für den österreichischen
        Lehrplan &bdquo;Digitale Grundbildung&ldquo; der 5. bis 8. Schulstufe bereit. Die Inhalte
        folgen den Kompetenzbereichen Orientierung, Information, Kommunikation, Produktion und
        Handeln.
      </p>
    ),
  },
  {
    title: 'Haftung für Inhalte',
    body: (
      <p>
        Trotz sorgfältiger Erstellung übernehmen wir keine Gewähr für die Aktualität, Richtigkeit
        und Vollständigkeit der bereitgestellten Inhalte. Für externe Links wird keine Haftung
        übernommen — verantwortlich für die Inhalte verlinkter Seiten sind ausschließlich deren
        Betreiber.
      </p>
    ),
  },
  {
    title: 'Urheberrecht',
    body: (
      <p>
        Materialien (Arbeitsblätter, Theorie-Texte, Modul-Inhalte) sind urheberrechtlich geschützt.
        Eine Verwendung für nicht-kommerzielle Bildungszwecke im Klassenverband ist ausdrücklich
        erwünscht; weitergehende Nutzung bitte per E-Mail anfragen.
      </p>
    ),
  },
];

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Impressum</h1>
      <div className="space-y-6 text-base leading-relaxed">
        {SECTIONS.map((s) => (
          <Section key={s.title} title={s.title}>
            {s.body}
          </Section>
        ))}
      </div>
    </div>
  );
}
