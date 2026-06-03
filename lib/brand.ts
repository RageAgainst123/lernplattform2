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
  // Match ist case-insensitive (siehe isAdmin in lib/auth/admin-auth.ts).
  adminEmails: [
    'geoschlegel@gmail.com',
    'georg.schlegel@nms-pitten.ac.at', // Schul-O365-Konto Geo
  ] as readonly string[],
} as const;

// Copyright-Jahr für den Footer. Wird zur Modul-Lade-Zeit (also einmal pro
// Server-Start / Build) berechnet — NICHT in jedem Render. Vermeidet
// Hydration-Mismatch-Risiko (CLAUDE.md: kein `new Date()` im Render).
// Bei Jahreswechsel reicht ein neuer Deploy.
export const COPYRIGHT_YEAR = new Date().getFullYear();

// ===========================================================================
// Design-Tokens — Single Source of Truth für JS/TS-Code.
// Tailwind v4 nutzt parallel `@theme` in `app/globals.css` (CSS-Variablen) —
// die Hex-Werte hier MÜSSEN identisch sein, damit JS-Code (z.B. Email-
// Templates, react-pdf, dynamisch erzeugte Inline-Styles) konsistent zur
// CSS-Theme-Quelle bleibt.
//
// **Druckbare Arbeitsblätter** (Python + reportlab) spiegeln diese Werte in
// `arbeitsblaetter/_design_tokens.py`. Bei JEDER Änderung BEIDE Stellen
// updaten + `docs/DESIGN-SYSTEM.md` aktualisieren. Siehe ADR-0010.
// ===========================================================================

// Farb-Palette. Hex-Strings, damit sie sowohl in Tailwind-Klassen-Generierung
// (`bg-[#2563eb]`) als auch in PDF-Helpern verwendet werden können.
export const COLORS = {
  // Akzent / Primary — Brand-Blau.
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',
  // Neutral-Skala (Slate).
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  // Semantik.
  success: '#16a34a',
  warning: '#ca8a04',
  error: '#dc2626',
} as const;

// Spacing-Skala in Pixel (entspricht Tailwind 1/2/3/4/6/8 = 4/8/12/16/24/32).
// In Python (reportlab) als Millimeter umrechnen (1pt ≈ 0.353 mm, aber wir
// nutzen direkt einen mm-Wert, siehe _design_tokens.py).
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Typografie-Größen in Pixel (Web). reportlab-Helvetica nutzt die spiegelnden
// Point-Werte aus _design_tokens.py (1pt ≈ 1.333 px, in der Praxis nehmen
// wir leicht abweichende Werte für gutes Druck-Bild).
export const TYPE = {
  h1: 28,
  h2: 20,
  h3: 16,
  body: 14,
  small: 12,
  micro: 10,
} as const;

// Border-Radius in Pixel.
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;
