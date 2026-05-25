# Lernplattform für Digitale Grundbildung

Lernplattform für die österreichische Digitale Grundbildung (Sekundarstufe I,
5.–8. Schulstufe). Hybrid aus zwei Säulen:

1. **Öffentliche Materialbibliothek** — frei zugängliche PDFs (Theorie,
   Arbeitsblätter, Stundenbilder), ohne Login.
2. **Interaktive Modulplattform** — modulbasiertes Lernen mit Block-Engine
   (Quiz, Drag-Drop, Lückentext, Reflexion), Lehrer:innen-Login und
   Klassencode-Login für Schüler:innen.

**DSGVO-konform by design:** keine personenbezogenen Daten von Schüler:innen
(Codenamen statt Namen), Hosting in Frankfurt (Supabase EU + Vercel).

## Stack

- **Next.js 16** (App Router, Server Components, Turbopack) · **React 19.2** · **TypeScript** strict
- **Tailwind CSS v4** · **shadcn/ui** (Base UI)
- **Supabase** (Frankfurt): Auth + PostgreSQL mit Row-Level Security + Storage, via `@supabase/ssr`
- **react-hook-form + Zod**, **TanStack Query**, **@dnd-kit**, **framer-motion**
- **Vitest** + **Testing Library** · **ESLint** (strict) + **Prettier** · **Husky** + **lint-staged** + **CommitLint**
- Paketmanager: **pnpm** · Hosting: **Vercel**

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

Datenbank-Schema einspielen: die SQL-Dateien aus `supabase/migrations/`
(`0001_initial_schema.sql`, `0002_rls_policies.sql`) im Supabase SQL-Editor
ausführen. Für E-Mail-Versand (Magic Link) ist ein SMTP-Provider (z. B. Resend)
in den Supabase-Auth-Einstellungen zu hinterlegen.

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
  login/          Lehrer:innen-Login (Magic Link)
  auth/confirm/   Auth-Callback (verifyOtp)
  lehrer/         Geschützter Lehrer:innen-Bereich
components/
  ui/             shadcn/ui (via CLI verwaltet)
  teacher/        Lehrer:innen-spezifische UI
lib/
  supabase/       client.ts, server.ts, middleware.ts
  auth/           Auth-Helper + Server Actions
  schemas/        Zod-Schemas (Blöcke, Entitäten)
supabase/
  migrations/     SQL-Migrationen (Schema + RLS)
docs/
  adr/            Architecture Decision Records
proxy.ts          Auth-Token-Refresh + Routenschutz (Next-16-Konvention)
```

## Qualität

Pre-Commit-Hooks (Husky + lint-staged) führen ESLint, Prettier und betroffene
Tests aus. CI (GitHub Actions) prüft bei jedem Push lint, format, typecheck,
test und build. Architekturentscheidungen sind in `docs/adr/` dokumentiert.
