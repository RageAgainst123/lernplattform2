# Lernplattform für Digitale Grundbildung

Lernplattform für die österreichische Digitale Grundbildung (Sekundarstufe I,
5.–8. Schulstufe). Hybrid aus zwei Säulen:

1. **Öffentliche Materialbibliothek** — frei zugängliche PDFs (Theorie,
   Arbeitsblätter, Stundenbilder), ohne Login.
2. **Interaktive Modulplattform** — modulbasiertes Lernen mit Block-Engine
   (Quiz, Zuordnung, Lückentext, Reflexion), Lehrer:innen-Login und
   Klassencode-Login für Schüler:innen.

**DSGVO-konform by design:** keine personenbezogenen Daten von Schüler:innen
(Codenamen statt Namen), Hosting in Frankfurt (Supabase EU + Vercel).

## Stack

- **Next.js 16** (App Router, Server Components, Turbopack) · **React 19.2** · **TypeScript** strict
- **Tailwind CSS v4** (`@theme` in CSS) · **shadcn/ui** (Base UI, **nicht** Radix)
- **Supabase** (Frankfurt): Auth + PostgreSQL mit Row-Level Security + Storage, via `@supabase/ssr`
- **jose** (Schüler:innen-JWT, HS256, 1 Jahr, HTTP-Only-Cookie) ·
  **bcryptjs** (PIN-Hash, SALT_ROUNDS=10)
- **@react-pdf/renderer** (Lehrer:innen-PDF-Export, dynamischer Import)
- **lucide-react** (Icons) · **react-hook-form + Zod** (Formulare/Validierung)
- **Vitest** + **Testing Library** · **ESLint** (strict) + **Prettier** · **Husky** + **lint-staged** + **CommitLint**
- Paketmanager: **pnpm** · Hosting: vorgesehen **Vercel** (noch nicht deployt)

### Lerninhalte

Module bestehen aus Blöcken (Block-Engine, 7 Typen):

| Typ               | Verwendung                                        |
| ----------------- | ------------------------------------------------- |
| `text`            | Erklärtext, Theorie-Block                         |
| `infobox`         | Hervorgehobener Tipp / Merksatz                   |
| `multiple_choice` | Eine oder mehrere Antworten aus Auswahl           |
| `true_false`      | Wahr/Falsch-Aussage                               |
| `fill_blank`      | Lückentext mit Wort-Pool (Tippen statt Drag-Drop) |
| `match`           | Begriff → Kategorie zuordnen                      |
| `reflection`      | Freitext-Antwort der Schüler:in                   |

Module haben zwei **Anzeige-Modi** (Spalte `modules.display_mode`):

- `quiz` (Default) — Block-für-Block, Sofort-Feedback. `ModuleRunner.tsx`.
- `worksheet` — alle Aufgaben auf einer scrollbaren Seite, Auto-Save (800 ms),
  definitive Abgabe via „Abgeben"-Button. `WorksheetRunner.tsx`.

## Setup

Voraussetzungen: Node ≥ 20, pnpm.

```bash
pnpm install
```

`.env.local` anlegen (Vorlage: `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Datenbank-Schema einspielen: **alle** SQL-Dateien aus `supabase/migrations/`
der Reihe nach (`0001_initial_schema.sql` bis `0007_submissions_feedback.sql`)
im Supabase SQL-Editor ausführen. Für E-Mail-Versand (Magic Link) ist ein
SMTP-Provider (z. B. Resend) in den Supabase-Auth-Einstellungen zu hinterlegen.

## Befehle

| Befehl               | Zweck                            |
| -------------------- | -------------------------------- |
| `pnpm dev`           | Dev-Server (Port 3000)           |
| `pnpm build`         | Produktions-Build                |
| `pnpm start`         | Produktions-Server               |
| `pnpm test`          | Unit-/Integrationstests (Vitest) |
| `pnpm test:coverage` | Tests mit Coverage-Report        |
| `pnpm lint`          | ESLint                           |
| `pnpm typecheck`     | TypeScript (`tsc --noEmit`)      |
| `pnpm format`        | Prettier (schreibend)            |

## Projektstruktur

```
app/              Next.js Routes (App Router)
  (public)/       Landing + öffentliche Material-Bibliothek (/dgb/*)
  k/              Klassencode-Eingabe + Schüler:innen-Login
  s/              Geschützter Schüler:innen-Bereich (Dashboard + Modul-Runner)
  login/          Lehrer:innen-Login (Magic Link)
  auth/confirm/   Auth-Callback (verifyOtp)
  lehrer/         Geschützter Lehrer:innen-Bereich
  admin/          Autor:innen-Bereich (Modul-Editor, Material-Upload)
  impressum/      Pflicht-Impressum
  datenschutz/    Datenschutzerklärung (DSGVO)
components/
  ui/             shadcn/ui (via CLI verwaltet, nicht manuell)
  site/           Globaler Header/Footer/Shell (SiteHeader, HeaderAuth, MobileMenu)
  blocks/         Block-Engine (7 Renderer + ModuleRunner + WorksheetRunner)
  student/        ModuleCard, StatusSummary, StudentLoginForm
  teacher/        Code-Liste, CodeListPdf (PDF-Export, dynamischer Import)
  admin/          Modul-Editor (BlockList, BlockEditor, ImportJsonDialog)
lib/
  brand.ts        BRAND-Konstante + adminEmails-Allowlist
  supabase/       client.ts (Browser), server.ts (Server), admin.ts (Service-Role)
  auth/           teacher-auth, student-auth, admin-auth, pin, actions, …
  blocks/         evaluate.ts (Auswertung), fill-blank.ts (shuffle)
  db/             DB-Layer pro Domäne (classes, modules, materials, student-modules, …)
                  Pure Helpers in eigenen Files (z.B. student-modules-status.ts)
  schemas/        Zod-Schemas (Blöcke, Entitäten)
supabase/
  migrations/     SQL-Migrationen (0001 Schema, 0002 RLS, 0003 join_code, …)
  seed-test-accounts.sql  ⚠ NUR LOKAL/DEV: Test-Klasse 5T mit PIN 0000
docs/
  INHALTSKONZEPT.md  Inhalts-Begriffe (Material vs. Modul, Navigations-Hierarchie)
  ROLES.md           Rollen, Auth-Mechanismen, Zugriffsrechte
  adr/               Architecture Decision Records (0001–0012)
proxy.ts          Auth-Token-Refresh + Routenschutz (Next-16-Konvention)
CLAUDE.md         Session-Notizen für AI-Pair (Stolperfallen, Konventionen, Phasen)
CHANGELOG.md      Phasen-Verlauf (reverse-chronologisch)
```

## Qualität

Pre-Commit-Hooks (Husky + lint-staged) führen ESLint, Prettier und betroffene
Tests aus. CI (GitHub Actions) prüft bei jedem Push lint, format, typecheck,
test und build. Architekturentscheidungen sind in `docs/adr/` dokumentiert.

## Test-Konten (nur lokales / Dev-Supabase)

Für reproduzierbares lokales Smoke-Testen liegt im Repo ein Seed-Skript für
fixe Test-Konten:

```bash
# 1) Lokale Supabase-Instanz starten (Docker)
supabase start

# 2) Einmal /login als Lehrer:in besuchen, damit ein Profil in `teachers`
#    angelegt wird (z. B. mit deiner echten Email).

# 3) Test-Seed einspielen (idempotent; kann mehrfach laufen):
supabase db remote sql --file supabase/seed-test-accounts.sql
```

Das Skript legt an:

- **Klasse 5T** (Name „Testklasse"), `join_code = TEST00`
- **Codes:** `5T-01`, `5T-02`, `5T-03`, alle mit **PIN `0000`**
- Falls ein EVA-Modul existiert, wird es automatisch zugewiesen.

Login als Schüler:in: `/k` → Code `TEST00` → Codename `5T-01` (oder 02/03)
→ PIN `0000`.

⚠ **NIEMALS in der Produktions-DB ausführen.** Der bcrypt-Hash für PIN 0000
ist im Skript hardcoded. Der Schutz besteht darin, dass diese Zeile nie auf
Prod landet.

### Test-Lehrer:in

Lehrer:innen-Konten entstehen automatisch beim ersten Magic-Link-Login. Für
Tests einfach ein eigenes Postfach-Alias verwenden (`geo+test@gmail.com`,
`geo+demo@gmail.com`, …) — Gmail leitet die alle ins gleiche Postfach. Beim
ersten Login wird ein `teachers`-Profil automatisch angelegt
(`ensureTeacherProfile` in `lib/auth/teacher-auth.ts`).

**Admin-Status** bekommt ein Lehrer:innen-Konto nur, wenn seine Email auch in
`BRAND.adminEmails` (`lib/brand.ts`) steht. Sonst ist es eine normale
Lehrer:in.

## Weiterführende Dokumentation

- [`CLAUDE.md`](./CLAUDE.md) — Session-Notizen für die AI-Pair-Arbeit
  (Stolperfallen, Konventionen, Phasen-Status)
- [`CHANGELOG.md`](./CHANGELOG.md) — Phasen-Verlauf (reverse-chronologisch)
- [`docs/INHALTSKONZEPT.md`](./docs/INHALTSKONZEPT.md) — Material vs. Modul,
  Display-Modes, Navigations-Hierarchie
- [`docs/ROLES.md`](./docs/ROLES.md) — Rollen, Auth-Mechanismen, Zugriffe,
  Header-Verhalten
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records (Warum-Antworten)
