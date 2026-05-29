// Zentrale Brand-Konstanten: Name, Tagline, Domain. Alle UI-Stellen (Header,
// Footer, Layout-Metadaten, Impressum, Datenschutz) lesen aus dieser Datei,
// damit ein späterer Plattform-Rename in EINER Datei stattfindet.
// Stand 2026-05-28: „DGB Austria" ist ein PLATZHALTER bis User-Entscheidung.

export const BRAND = {
  name: 'DGB Austria',
  shortName: 'DGB',
  tagline: 'Materialien und interaktive Module für die österreichische Digitale Grundbildung.',
  description:
    'Frei zugängliche Materialbibliothek und interaktive Lernplattform für die Digitale Grundbildung (Sekundarstufe I) in Österreich. Lehrer:innen verwalten Klassen, Schüler:innen arbeiten mit Klassencode und PIN.',
  domain: 'dgb-austria.at',
  baseUrl: 'https://dgb-austria.at',
  contactEmail: 'geoschlegel@gmail.com',
  github: 'https://github.com/RageAgainst123/lernplattform2',
  hostingRegion: 'Frankfurt (eu-central-1)',
  // Admin-Allowlist: nur diese E-Mail-Adressen haben Zugriff auf /admin
  // (zusätzlich zum Lehrer:innen-Login). Siehe docs/ROLES.md.
  adminEmails: ['geoschlegel@gmail.com'] as readonly string[],
} as const;
