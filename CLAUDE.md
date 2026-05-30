# Lernplattform DGB — Claude-Session-Notizen

> **Bevor du arbeitest:** Lies kurz `docs/INHALTSKONZEPT.md` (was sind
> Material/Modul, Stufen-Hierarchie) und `docs/ROLES.md` (wer darf was).
> Bei Architektur-Fragen: `docs/adr/`. Bei „was wurde wann gebaut" siehe
> `CHANGELOG.md`.

## Auto-Imports

Folgende Dateien werden mit dieser CLAUDE.md geladen:

- @AGENTS.md
- @docs/INHALTSKONZEPT.md
- @docs/ROLES.md

## Was diese App tut (1 Satz)

Browser-basierte Lernplattform für die österreichische **Digitale Grundbildung**
(Sekundarstufe I, 5.–8. SSt.) — hybrid aus öffentlicher PDF-Materialbibliothek
(`/dgb`) und einer interaktiven Modulplattform (Klassencode-Login für
Schüler:innen unter `/s`, Magic-Link für Lehrer:innen unter `/lehrer`, Admin
für den Autor unter `/admin`).

## Befehle

| Befehl                              | Was es tut                                                 |
| ----------------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                          | Dev-Server (Port 3000, Turbopack)                          |
| `pnpm build`                        | Production-Build → `.next/`                                |
| `pnpm start`                        | Production-Server (PORT=3001 für lokales Smoke)            |
| `pnpm test`                         | vitest run (alle Tests einmalig)                           |
| `pnpm test:watch`                   | vitest watch                                               |
| `pnpm test:coverage`                | Coverage-Report (HTML + Konsole)                           |
| `pnpm lint`                         | ESLint (strict-Regeln, ohne `--fix`)                       |
| `pnpm typecheck`                    | `tsc --noEmit`                                             |
| `pnpm format`                       | Prettier (schreibend)                                      |
| `pnpm validate:module <datei.json>` | Modul-JSON gegen das echte Schema prüfen (vor Import/Seed) |

**Vor jedem Commit:** `pnpm lint && pnpm typecheck && pnpm test -- --run && pnpm build`.
Pre-Commit-Hook (Husky + lint-staged) führt eslint + prettier + betroffene
Tests automatisch aus.

## Module bauen (Block-JSON mit Lösungen)

Neue Lernmodule erstellt man nach `docs/AUTOR-WORKFLOW.md`. Die **verbindliche
Block-Spezifikation** — jedes Feld, wo die Lösung steht, Bewertungsregel pro Typ,
geprüftes Referenz-Modul — steht in `docs/MODUL-SPEZIFIKATION.md`. Jedes
Modul-JSON **vor dem Import** mit `pnpm validate:module <datei.json>` prüfen
(fängt Schema- + Logik-Fehler ab). Quelle der Wahrheit: `lib/schemas/blocks.ts`
(Struktur) + `lib/blocks/evaluate.ts` (Bewertung). Ein **neuer Block-Typ** berührt
genau diese beiden Dateien + einen Renderer in `components/blocks/` — dann läuft
die ganze Bewertungs-Pipeline (Score, %, Schwelle, Matrix) automatisch weiter.

## Stack-Kurz

Next.js 16.2 (App Router, Turbopack) · React 19.2 · TypeScript strict · Tailwind
v4 (CSS-based `@theme`) · shadcn/ui (Base UI, **nicht** Radix) · Supabase
(Frankfurt eu-central-1) via `@supabase/ssr` · jose (Schüler:innen-JWT) ·
bcryptjs (PIN-Hash, rounds=10) · @react-pdf/renderer (Lehrer:innen-PDF-Export) ·
Vitest + Testing Library · Husky + lint-staged + CommitLint (lowercase!).

## Architektur (eine Zeile pro Modul)

### Routen (`app/`)

- **`app/`** — Next-App-Router. **Konvention:** jede protected Page beginnt mit
  `requireXxx()` (siehe ROLES.md §3.2).
- **Landing + `/dgb/*`** — öffentliche Material-Browser-Routen
- **`app/k/`** — Klassencode-Eingabe + Codename/PIN-Login der Schüler:innen
- **`app/s/`** — Schüler:innen-Bereich (Dashboard + Modul-Runner)
- **`app/lehrer/`** — Lehrer:innen-Dashboard + Klassen-Verwaltung
- **`app/admin/`** — Autor:innen-Bereich (Modul-Editor, Material-Upload)
- **`app/login/`** + **`app/auth/confirm/`** — Magic-Link-Flow

### Bibliothek (`lib/`)

- **`lib/brand.ts`** — `BRAND`-Konstante: Name, baseUrl, **`adminEmails`-Allowlist**
- **`lib/auth/`** — alle Auth-Helper:
  - `teacher-auth.ts` (Supabase, `getUser`/`requireUser`/`ensureTeacherProfile`)
  - `student-auth.ts` (jose, `getStudentSession`/`requireStudentSession`)
  - `student-session.ts` (JWT-Sign + Verify, Test-First-Modul)
  - `admin-auth.ts` (`isAdmin` + `requireAdmin`)
  - `pin.ts` (`generatePin` + `hashPin` + `verifyPin`, bcrypt, SALT_ROUNDS=10)
  - `actions.ts` (signOut Server Action für Lehrer:in)
  - `student-actions.ts` (`studentLogout`, `loginStudent` Server Actions)
- **`lib/supabase/`** — `client.ts` (Browser), `server.ts` (Server Component),
  `admin.ts` (Service-Role, **server-only**, umgeht RLS)
- **`lib/db/`** — DB-Layer, ein File pro Domäne. **Server-only.** Beispiele:
  - `classes.ts` + `class-actions.ts`
  - `student-codes.ts` + `student-code-actions.ts`
  - `student-login.ts` + `student-login-action.ts`
  - `student-modules.ts` (DB-Bindung) + `student-modules-status.ts` (pure Helpers!)
  - `modules.ts` + `module-actions.ts`
  - `materials.ts` + `material-actions.ts`
  - `progress-action.ts` (saveProgress, saveWorksheetDraft, submitWorksheet)
  - `public-content.ts` + `public-content-stufe.ts` (öffentliche Browser-Routen)
- **`lib/blocks/`** — Block-Engine-Logik (Auswertung, Shuffle-Helper)
  - `evaluate.ts` — `BlockAnswer`-Typen + `isGraded`/`evaluateBlock`
  - `fill-blank.ts` — `shuffle<T>()` Fisher-Yates für FillBlank-Pool
- **`lib/schemas/`** — Zod-Schemas (Blöcke, Entities)

### UI (`components/`)

- **`components/ui/`** — shadcn/ui-Primitives (NICHT manuell anfassen; via CLI)
- **`components/site/`** — globaler Header/Footer/Shell
  - `SiteHeader.tsx` — **async Server-Komp.**; rollenabhängiger Nav-Link via `roleNavLink()`
  - `HeaderAuth.tsx` — Server-Slot für „Angemeldet als …" + Abmelden
  - `MobileMenu.tsx` — Client; Auth-Block + Logout-Form als Sub-Komp.
  - `SiteFooter.tsx`, `SiteShell.tsx`, `Logo.tsx`
- **`components/blocks/`** — Block-Renderer + Modul-Runner
  - 7 Block-Typen: `TextBlock`, `InfoboxBlock`, `MultipleChoiceBlock`,
    `TrueFalseBlock`, `FillBlankBlock`, `MatchBlock`, `ReflectionBlock`
  - `BlockView.tsx` — Switch-Dispatcher
  - `ModuleRunner.tsx` (Quiz-Modus, Block-für-Block) + `useModuleRunner.ts`
  - `WorksheetRunner.tsx` (Worksheet-Modus, alle Aufgaben auf einer Seite)
    - `useWorksheetState.ts` + `WorksheetStatusBanner.tsx` + `WorksheetTaskBlock.tsx`
    - `worksheet-task-numbers.ts` (pure Helpers)
  - `useShuffled.ts` — **hydration-sicherer** Shuffle-Hook (Server identisch, Mix nach Mount)
  - `useDebouncedCallback.ts`
- **`components/student/`** — `ModuleCard.tsx` (Status-Badge + CTA),
  `StatusSummary.tsx` (Zähler-Pille), `StudentLoginForm.tsx`
- **`components/teacher/`** — PDF-Export der Code-Liste, Code-Generator-UI
- **`components/admin/`** — Modul-Editor (BlockList, BlockEditor), Material-Upload,
  ImportJsonDialog

### Zugang/Schutz

- **`proxy.ts`** (Next-16-Konvention statt `middleware.ts`!) — Edge-Layer:
  - Supabase-Cookie-Refresh
  - Routen-Schutz `/s/*` (jose), `/lehrer/*` (Supabase), `/admin/*` (Supabase + Allowlist)
  - Legacy-Permalink-Redirects (alte /dgb/stufe/bereich-URLs auf Hash-Anker)

## Stolperfallen (CRITICAL — bitte erst lesen, bevor du Bugs jagst)

### Next 16 / React 19

- **`proxy.ts`** **nicht** `middleware.ts`! Next 16 hat das umbenannt.
- **Async Server-Komponenten:** `<SiteHeader>` ist async, das geht NUR in
  Server-Komponenten-Parents. Wenn du sie in einer Client-Komp. renderst,
  bekommst du seltsame Fehler.
- **`server-only`-Package:** Dateien die `import 'server-only'` machen, dürfen
  **nicht** in Client-Components landen — auch nicht transitiv über `lib/db`.
  Lösung: pure Helper raus in eigene Datei (Beispiel:
  `student-modules-status.ts` neben `student-modules.ts`).
- **Hydration-Mismatches bei Math.random():** wenn du irgendetwas mit
  `Math.random()` im Render machst → **kein `useMemo`**! Sondern
  `useShuffled<T>()` aus `components/blocks/useShuffled.ts` (initial Original-
  Reihenfolge, Mix in `useEffect` nach Mount). Sonst weicht Server- und
  Client-Render ab → React verwirft Tree.

### Supabase + Auth

- **`SUPABASE_SECRET_KEY` NIEMALS** im Client-Bundle, NIEMALS in URLs,
  NIEMALS in Logs. Nur via `lib/supabase/admin.ts` (`server-only`).
- **Klartext-PIN wird NIE persistiert.** `hashPin()` läuft IMMER vor INSERT.
  Bei „PIN neu" wird der neue Hash gespeichert, der alte verworfen.
- **`@supabase/ssr`** mit `cookies()` aus `next/headers` — Server-Helpers in
  `lib/supabase/server.ts`. Wenn du dort etwas anfasst, prüfe die Cookie-
  Refresh-Logik in `proxy.ts` mit.
- **Schüler:innen-Session ist jose-JWT in HTTP-Only-Cookie** (Name siehe
  `STUDENT_COOKIE` in `lib/auth/student-session.ts`, HS256, 8 h). Hat
  NICHTS mit Supabase Auth zu tun.
- **DSGVO:** keine PII von Schüler:innen — Codenamen wie `5A-01`, keine echten
  Namen. Hosting auf Supabase Frankfurt-Region ist verbindlich.

### Tests + jsdom

- Auth-Helpers (`getUser`, `requireUser`, …) importieren `'server-only'` →
  Tests die `vi.mock('server-only', () => ({}))` brauchen.
- `SiteHeader` ist async → Tests müssen `const ui = await SiteHeader()` und
  dann `render(ui)`. Auth-Slot via `vi.hoisted` + `vi.mock('./HeaderAuth')`.
- **`react-hooks/set-state-in-effect`** ist aktiviert. Wenn du `setState` in
  `useEffect` brauchst (z. B. Hydration-Schutz), nimm einen klar
  begründeten `// eslint-disable-next-line`-Kommentar.

### ESLint-Limits

- **max-lines: 200** pro Datei
- **max-lines-per-function: 50** (200 für `app/admin/*`)
- **complexity: 10**
- Wenn du drüber kommst: Datei aufteilen, nicht das Limit anheben.
- **`react-hooks/exhaustive-deps`**: pflicht. Lies die Warnung — die Antwort
  ist fast nie „disable".

### Lokales Smoke-Testen

- **`pnpm start` IMMER NACH `pnpm build` starten.** Sonst kann es eine Race
  geben, in der ein älterer Next-Server auf das nun überschriebene `.next/`
  zeigt und alte Komponenten liefert.
- Wenn ein dev-Server (Port 3000) und ein prod-Server (3001) parallel laufen,
  Cookies sind oft port-unabhängig (Chromium kennt nur den Host bei
  `localhost`) — aber die App-Versionen können auseinanderlaufen.
- **Hard-Reload via `?cb=<timestamp>`** wenn etwas alt aussieht (oder den
  Server stoppen + neu starten).

## Test-Konten (lokales/Dev-Supabase)

Für bequemes Smoke-Testen ohne dass die echten 5A-Accounts touched werden:

```bash
# 1) Lokale Supabase-Instanz (Docker) starten:
supabase start

# 2) Einmal in /login als Lehrer:in einloggen (ein Profil in `teachers` anlegen).

# 3) Test-Seed laufen lassen (idempotent — kann mehrfach laufen):
supabase db remote sql --file supabase/seed-test-accounts.sql
```

Das Skript legt an:

- **Klasse 5T** (Name „Testklasse"), `join_code = TEST00`
- **Codes:** `5T-01`, `5T-02`, `5T-03`, alle mit **PIN `0000`**
- Falls vorhanden: EVA-Modul automatisch zugewiesen

⚠ **NIE auf Produktions-DB ausführen.** Hash für PIN 0000 ist im Skript
hardcoded — der Schutz besteht darin, dass diese Zeile nie auf Prod landet.

**Lehrer:innen-Test-Account:** Magic-Link für `geo+test@gmail.com` (oder eine
beliebige Email die du selbst empfangen kannst) wird automatisch zu einem
`teachers`-Profil beim ersten Login. Admin-Status nur wenn die Email auch in
`BRAND.adminEmails` steht (sonst nur normale Lehrer:in).

## Konventionen

- TypeScript strict (default), kein `any` außer für Drittbibliotheks-Bridges.
- **2 Spaces** für Indent (Prettier erzwingt).
- **Pure Helpers** in eigener Datei (Beispiel: `student-modules-status.ts`)
  damit Tests und Client-Komponenten sie ohne `'server-only'`-Blocker
  importieren können.
- **Co-Located Tests:** `foo.ts` → `foo.test.ts` (`.tsx` für JSX).
- Sprache:
  - **Code & Datenmodell:** Englisch (`AssignedModule`, `progressStatusMap`).
  - **UI-Texte:** Deutsch (Österreich, „Schüler:innen"-Doppelpunkt-Form).
  - **Bezeichner für Inhalte:** **Material** (PDF) vs. **Modul** (interaktiv).
    NIE „Aufgabe" als technischer Begriff.
- **Commits:** Conventional Commits, **klein geschrieben**! `feat: x` (nicht
  `feat: X`). CommitLint blockt sonst. Footer:
  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- **Imports:** Lazy-Code-Splitting für „schwere" Libraries (`@react-pdf/renderer`)
  via `next/dynamic({ ssr: false })`.

## Workflow für neue Features

1. **Verstehe das Domänenmodell** — lies kurz `docs/INHALTSKONZEPT.md` (was ist
   Material vs. Modul) und `docs/ROLES.md` (welche Rolle darf was).
2. **Test-First** (wo sinnvoll): Schreib einen failing Test, der das gewünschte
   Verhalten beschreibt.
3. **Mache die Änderung**.
4. **Gates:** `pnpm lint && pnpm typecheck && pnpm test -- --run && pnpm build`.
5. **Browser-Smoke** (`pnpm start` auf Port 3001), wenn UI-Änderung.
6. **Commit** mit lowercase Conventional Commit + Claude-Footer.
7. **Doku-Folgekosten:** wenn etwas Strukturelles geändert wurde (neue
   Display-Mode, neue Rolle, neuer Schema-Migration-Eintrag), aktualisiere:
   - `CHANGELOG.md` (immer)
   - `docs/INHALTSKONZEPT.md` (wenn Inhalts-Begriffe)
   - `docs/ROLES.md` (wenn Auth/Schutz)
   - Neue `docs/adr/NNNN-titel.md` für Strukturentscheidungen
   - `CLAUDE.md` (wenn Stolperfallen oder Modul-Übersicht)

## Verbotene Aktionen

- **Niemals** `SUPABASE_SECRET_KEY` ausdrucken/loggen/in URLs.
- **Niemals** Klartext-PIN persistieren (siehe PLATTFORM_MANIFEST Hard Rule #10).
- **Niemals** `git rebase -i` oder andere interaktive Git-Befehle (Auto-Mode-Block).
- **Niemals** echte Schüler:innen-Daten zum Testen anlegen — nutze die
  Test-Konten oben.
- **Niemals** `git commit --no-verify` (CommitLint und Husky sind aus
  gutem Grund da).
- **Niemals** `npm` statt `pnpm` (Lockfile-Drift).
- **Niemals** `package.json`-Hauptversionen ohne Auftrag anheben — der
  Stack ist bewusst stabil (Next 16 hat schon genug Breaking Changes).

## Phasen-Status (Stand 2026-05-29)

- ✅ **Phase 1:** Scaffold (Next 16, Tailwind v4, ESLint strict, Vitest)
- ✅ **Phase 2:** shadcn/ui-Setup, Demo-Verifikation
- ✅ **Phase 3:** Supabase-Schema (7 Tabellen, RLS, Migrationen 0001/0002)
- ✅ **Phase 4:** Lehrer:innen-Login (Magic Link, ensureTeacherProfile)
- ✅ **Phase 5:** Klassen-Verwaltung + Schüler:innen-Codes (bcrypt-PINs)
- ✅ **Phase 6:** PDF-Export der Code-Liste (@react-pdf/renderer)
- ✅ **Phase 7:** Schüler:innen-Login (jose, /k → /s), Migration 0003 (join_code)
- ✅ **Phase 8:** Block-Engine, 7 Block-Typen, ModuleRunner (Quiz), EVA-Demo
- ✅ **Phase 9:** Öffentliche Materialbibliothek (`/dgb/[stufe]/[bereich]`,
  Hash-Accordion-Navigation, Bereich-Stufe-Aggregation)
- ✅ **Phase 10:** Branding (Header, Footer, Impressum, Datenschutz, Akzent)
- ✅ **Phase 11:** Admin-Bereich + Modul-Editor + Material↔Modul-Verknüpfung,
  Migration 0005 (`materials.related_module_id`)
- ✅ **Phase 12:** Worksheet-Modus (Display-Modes Quiz vs. Worksheet),
  Migration 0006 (`modules.display_mode`), WorksheetRunner mit Auto-Save +
  Definitive-Submit, ADR-0006
- ✅ **Phase 13:** Schüler:innen-UX-Polish — Hydration-Fix, Login-Status im
  Header, Save-Indikator, Theorie-Trennung, 3-Status-Module-Badge (ADR-0007)
- ✅ **Phase 14:** Rollenabhängiger Header-Link + Dashboard-Übersicht
  (Status-Pille + Sortierung + Akzent-Karten + CTA) (ADR-0008)
- ✅ **Phase 15:** Lehrer:innen-Modul-Zuweisung im UI
  (`/lehrer/klassen/[id]` Modul-Sektion mit Dropdown + Liste) +
  Klassen-Fortschritts-Matrix (`/lehrer/klassen/[id]/fortschritt`):
  Schüler:innen × Module mit Status-Badges + Score
- 🔜 **Phase 16:** Lernpfad-Entscheidung, Lösch-Funktion für Klassen/Codes,
  Phase-2-Block-Typen, PWA/Offline

(Detaillierter Phasen-Verlauf siehe `CHANGELOG.md`.)
