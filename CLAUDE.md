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

Ein ganzes **Thema** (didaktisches Standard-Stundenbild: Hook → Theorie → Übung
→ Reflexion → optional Arbeitsblatt) folgt `docs/THEMA-WORKFLOW.md` (Ebene über
dem technischen Erstellungs-Prozess). Neue Lernmodule erstellt man nach
`docs/AUTOR-WORKFLOW.md`. Die **verbindliche
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
(Frankfurt eu-central-1) via `@supabase/ssr` · **Supabase Realtime Broadcast**
(Phase T, ADR-0016, Public-Channels mit UUID-Namen) · jose (Schüler:innen-JWT) ·
bcryptjs (PIN-Hash, rounds=10) · @react-pdf/renderer (Lehrer:innen-PDF-Export,
lazy via dynamic import) · Tiptap (12 Pakete, nur in `/s/heft/[id]`) ·
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
  - `student-actions.ts` (`studentLogout` Server Action; Login liegt in
    `lib/db/student-login-action.ts` → `studentLogin`)
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
  - `evaluate.ts` — `BlockAnswer`-Typen + `isGraded`/`gradeBlock` (0–1, teilpunkt-fähig)
    - `scoreModule`/`maxScore`/`percentScore`/`isPassed`/`blockResult` (Phase 16)
  - `fill-blank.ts` — `shuffle<T>()` Fisher-Yates für FillBlank-Pool
  - `points.ts` — Sprint-R Punkte-Formel (Time × Streak)
- **`lib/realtime/`** — Phase T Hybrid-Broadcast (ADR-0016)
  - `broadcast.ts` — `publishBroadcast(channelName, event, payload)` server-only,
    fire-and-forget. Wird in Quiz-/Live-Server-Actions NACH erfolgreichem
    DB-Write aufgerufen.
  - `channels.ts` — `channels.quizSession(id)` / `liveSession(classId)` /
    `classProgress(classId)` + `events.quiz.*` / `events.live.*` /
    `events.classProgress.*` Konstanten. Single Source of Truth für
    Channel-Namen und Event-Strings.
- **`lib/rate-limit.ts`** — In-Memory-Bucket-Rate-Limit pro IP (Pre-Launch C6).
  Zwei Bucket-Typen: `checkRate` (100/min, allgemein) + `checkLoginRate`
  (5/15min, PIN-Brute-Force-Schutz). `rateLimitGate(req, prefix)` als
  Convenience-Wrapper für API-Routen.
- **`lib/feature-flags.ts`** — Global-Kill-Switch (Pre-Launch C3): Env-Vars
  `QUIZ_DISABLED`/`LIVE_DISABLED`/`STUDENT_LOGIN_DISABLED` + freundliche
  Maintenance-Messages.
- **`lib/schemas/`** — Zod-Schemas (Blöcke, Entities)

### UI (`components/`)

- **`components/ui/`** — shadcn/ui-Primitives (NICHT manuell anfassen; via CLI)
- **`components/realtime/`** — Phase T (ADR-0016)
  - `useRealtimeWithFallback.ts` — generischer Hybrid-Hook: subscribed auf
    Supabase-Broadcast-Channel + parallel Polling 5s als Fallback. Liefert
    `{state, refetch}` — `refetch` ist für den schreibenden Tab (sofortiger
    Refetch nach Server-Action, spart Roundtrip).
- **`components/quiz/`** — Quiz-Hooks als Wrapper über `useRealtimeWithFallback`
  - `useQuizQuestionPoll.ts` (Schüler) / `useQuizBeamerPoll.ts` (Lehrer-Beamer,
    mit `refetch` für `onActionDone`) / `useQuizLobbyPoll.ts` (Hybrid:
    Lehrer-Modus Realtime, Schüler-Modus klassisches Polling 1.5s/5s da
    sessionId vor Quiz-Start nicht bekannt).
- **`components/student/useLiveSync.ts`** — Live-Präsentations-Hook, classId
  vom Server-Layout (`app/s/layout.tsx`).
- **`components/teacher/ProgressMatrixLive.tsx`** — Wrapper um Server-Component
  Fortschrittsmatrix, triggert `router.refresh()` bei Realtime-Event.
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
  `STUDENT_COOKIE` in `lib/auth/student-session.ts`, HS256,
  `SESSION_DURATION_SECONDS` = 1 Jahr — feste/eigene Geräte, kein tägliches
  Neu-Einloggen; Cookie-maxAge nutzt dieselbe Konstante). Hat NICHTS mit
  Supabase Auth zu tun.
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
#    den Inhalt von supabase/seed-test-accounts.sql im Supabase-SQL-Editor
#    ausführen (oder via psql gegen die lokale DB).
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
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
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

## Phasen-Status (Stand 2026-06-04)

- ✅ **Phase 1:** Scaffold (Next 16, Tailwind v4, ESLint strict, Vitest)
- ✅ **Phase 2:** shadcn/ui-Setup, Demo-Verifikation
- ✅ **Phase 3:** Supabase-Schema (7 Tabellen, RLS, Migrationen 0001/0002)
- ✅ **Phase 4:** Lehrer:innen-Login (Magic Link, ensureTeacherProfile)
- ✅ **Phase 5:** Klassen-Verwaltung + Schüler:innen-Codes (bcrypt-PINs)
- ✅ **Phase 6:** PDF-Export der Code-Liste (@react-pdf/renderer)
- ✅ **Phase 7:** Schüler:innen-Login (jose, /k → /s), Migration 0003 (join_code)
- ✅ **Phase 8:** Block-Engine, 7 Block-Typen, ModuleRunner (Quiz), EVA-Demo
- ✅ **Phase 9:** Öffentliche Materialbibliothek (`/dgb/[stufe]` mit
  Hash-Accordion-Navigation `#bereich/slug`, Bereich-Stufe-Aggregation;
  die alte `[bereich]`-Route wurde durch Hash-Anker ersetzt, proxy.ts
  308-redirectet Legacy-URLs)
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
- ✅ **Phase 16:** Abgaben einsehen (Lehrer:innen-Detailseite) + Feedback/
  Rückgabe-Zyklus (`returned`-Status, 4. Stufe) + automatische prozentuale
  Bewertung mit Bestehens-Schwelle pro Zuweisung. Migration 0007
  (`pass_threshold`, `teacher_feedback`, `returned_at`, `manual_marks` +
  RLS-UPDATE-Policy), ADR-0011 + ADR-0012, `docs/MODUL-SPEZIFIKATION.md` +
  `pnpm validate:module`.
- ✅ **Phase 17–22 (Live-Präsentation):** Beamer-Route, live_sessions,
  live_votes, Reveal/Lock, Heartbeat-Tod, „Beenden"-Button, 4 weitere
  Live-Block-Typen (quiz_poll, word_cloud, scale, understanding) plus
  Polling-API-Routes statt Server-Actions. Migrationen 0008–0011.
- ✅ **Phase E (E1):** Drei first-class Aktivitäten statt einem generischen
  „Modul". Migration 0012 (`modules.activity_kind` = `lernmodul`
  | `praesentation`), drei getrennte Admin-Routen
  (`/admin/lernmodule`, `/admin/praesentationen`, `/admin/arbeitsblaetter`),
  Admin-Dashboard mit drei großen Aktivitäts-Karten, `lib/activities.ts`
  als Single Source of Truth, AddBlockDialog filtert Block-Typen pro
  Aktivität. Alte URLs (`/admin/module/*`, `/admin/material/*`) redirecten
  weiterhin. Lehrer-Sicht: zugewiesene Module nach Aktivität gruppiert.
  Schüler-Dispatcher filtert Präsentationen aus (latenter Bug gefixt).
- ✅ **Phase E (E2 – Editor-Komfort):** Typ-spezifische Form-Builder pro
  Block-Typ statt JSON-Paste (commit `3ab275d`).
- ✅ **Phase G (G1–G5):** Themen-Lernpfade als first-class Entity.
  Migration 0013 (`topics` + `class_topics` + `modules.topic_id` +
  `modules.sort_order`), Admin-Themen-Verwaltung, Lehrer-Sicht mit
  Themen-Karten, Schüler:innen-Themen-Dashboard, Abschlusstest-
  Voraussetzungs-Check. Bugfix: Quiz + Abschlusstest brauchen eigene
  Admin-Routen.
- ✅ **Phase H + H+ (Schulheft mit Tiptap):** Migration 0014
  (`portfolio_entries` + `topic_writing_prompts`), Tiptap-Editor mit Word-
  ähnlichen Features (Color, Align, Underline, Strike, Link, Tabellen,
  FontFamily, FontSize, Emoji, Ribbon-UI), Pexels-Bild-Picker, Bild-Resize
  via Drag-Handles. ADR-0013. Commits `114cc66` → `94acc09`.
- ✅ **Phase O (O1–O6 — O365-SSO):** Multi-Tenant Azure-App, SSO für
  Schüler:innen UND Lehrer:innen, Tinkercad-Pattern für Klassen-Beitritt
  (`/k/join`). Migrationen 0015 (student_codes O365-Spalten) + 0016
  (codename-Reparatur) + 0017 (Domain-Allowlist). 5 Bug-Fix-Runden:
  Anzeigename, Klasse verlassen/löschen, Beamer-Code-Screen, Hydration-
  Bug, Settings-Dropdown, Klassenname. ADR-0014. Admin georg.schlegel@
  nms-pitten.ac.at hinzugefügt. Lehrer-SSO via Microsoft-Button auf
  `/login`. Commits `36512e0` → `964286b`.
- ✅ **Phase Q (Q1–Q6 — Word-Schulübungsheft):** OneDrive-Sharing-Link-
  basiertes Heft für SSO-Schüler:innen (KEIN Graph-API wegen Microsofts
  Juli-2025-Consent-Policy). EIN generelles Heft pro Schüler:in (nicht pro
  Thema), wird in allen Themen-Lernpfaden als zusätzliches Werkzeug
  angeboten. Migration 0018 (word_heft_links-Tabelle) + 0019
  (unique-Constraint-Korrektur). 7-Schritt-Anleitung passend zur deutschen
  Word-Web-UI. Lehrer-Klassen-Heft-Matrix mit Magic-Link-Hinweis. Header-
  Knopf „📓 Mein Heft" für SSO-Schüler:innen. Ehrliche HEAD-Probe-Logik
  (Login-Redirect → unverified statt broken). ADR-0015. Commits `220a77c`
  → `ba5400e`.
- ✅ **Sprint R (Solo-Quiz-Polish):** R1.1 Quiz-Endseite mit Score-Hero +
  Antwort-Übersicht, R1.2 Punkte-Formel als pure Helper
  (`lib/blocks/points.ts`), R1.3 Zeit + Streak server-seitig, R1.4
  „Falsche Fragen wiederholen", R1.5 Tippfehlertoleranz für Lückentext
  (Levenshtein ≤1). Commits `b83a95d` → `a1d43b8`.
- ✅ **Sprint S + Phase C (Live-Klassen-Quiz + Pre-Launch-Härtung):**
  Migration 0020 (quiz_sessions/\_participants/\_answers + RPC). S1 Lobby
  - Beitritt, S2 Live-Frage-Flow, S3 Leaderboard zwischen Fragen, S4
    Quiz-Ende-Podium. + C2-C8: /api/health, Global-Kill-Switch (Env-Vars),
    Quiz-Tagespensum 20/Tag (`lib/db/quiz-quota.ts`), `/status`-Page,
    Rate-Limit pro IP (`lib/rate-limit.ts`), Cache-Header, k6-Lasttest.
    `docs/QUIZ-MODI-SPEZIFIKATION.md`, `docs/SCALE-PLAN.md`,
    `docs/COST-CONTROLS.md`, `docs/PRE-LAUNCH-CHECKLIST.md`. Commits
    `9a3fc97` → `62fd2e6`.
- ✅ **Phase T (T0–T6 — Hybrid Realtime-Broadcast):** Supabase-Realtime
  als Push-Layer + Polling-Fallback 5s. ADR-0016. Channel-Pattern
  `quiz_session:{uuid}` / `live_session:{classId}` / `class_progress:
{classId}` (Public Channels, UUID-basiert). T0 Spike (75-115ms
  gemessen), T1 Helper + Hook (`lib/realtime/broadcast.ts`,
  `lib/realtime/channels.ts`, `components/realtime/useRealtimeWithFallback.ts`),
  T2 alle 6 Quiz-Server-Actions publishen, T3 Quiz-Hooks
  (useQuizQuestionPoll/useQuizBeamerPoll), T4 Lobby-Lehrer-Realtime,
  T5 Live-Präsentation (useLiveSync), T6 Fortschrittsmatrix
  (ProgressMatrixLive). Bugfixes: `self:true` damit publizierender Tab
  eigene Broadcasts empfängt, `{state, refetch}`-Return damit Lehrer-
  Buttons direkt refetchen. Tags `pre-phase-t-savepoint`,
  `phase-t-quiz-savepoint`, `phase-t-live-savepoint`. Commits `b398735`
  → `5d8940d`. **Architektur-Erkenntnis:** Realtime ideal für passive
  Empfänger, direkter Refetch ideal für schreibende Tabs.
- ✅ **Phase U1 (Pre-Launch Security-Blocker):** 5 parallele Audit-Agents
  (`docs/PRE-LAUNCH-AUDIT.md`) haben 30+ Befunde aufgedeckt. U1 deckt 5
  Launch-Blocker: CRIT-1 anonymer DoS auf `/api/live/end` (jetzt
  requireUser + classId-owner-check), CRIT-2 PIN-Brute-Force (jetzt
  `checkLoginRate` 5/15min pro IP+codename), CRIT-3 `touchQuizPresence`
  Heartbeat-Spoofing (toter Code, gelöscht), HIGH-1 Race in
  `commitAdvance` (WHERE-Klausel um `current_question_index` ergänzt),
  HIGH-4 Rate-Limits auf `/api/live/{end,results,wordcloud}`. Commit
  `9ec4626`.
- 🔜 **Phase U2 (Pre-Launch HIGH/MED):** ProgressMatrixLive Polling-
  Fallback, Broadcast-Timeout senken, `isAssigned`-Check in
  submitWorksheet, `enabled`-Option im Hook, Suspense-Boundaries,
  Security-Header. Geschätzt ~5h.
- 🔜 **Phase U3 (Pre-Launch Performance):** Beamer-Polling-RPC (10→2
  DB-Queries pro Tick), k6-Lasttest mit echtem Realtime (T7-Rest).
- 🔜 **Phase F (UI-Politur):** Editor-Layout-Redesign (Vorschau als Tab),
  Spacing/Typography-Pass, Mobile-Optimierung. (Aufgeschoben — Phase O+Q
  hatten Priorität.)
- 🔜 **Phase I (Lernmodul-Erweiterungen):** Diagnose-Modus, Selbsteinschätzung,
  Bonus-Blöcke, Übungsmodus. ~2 Tage.
- 🔜 **Phase J (Wissens-Anker):** Karteikarten + Glossar + Streak mit SM-2-
  Algorithmus. ~4 Tage.
- 🔜 **Phase K (Recherche-Auftrag):** Neuer Block-Typ als DGB-Kernkompetenz.
  ~2 Tage.

**Begriffs-Trio (Phase E, bindend):**

- **Arbeitsblatt** = PDF-Upload zum Drucken/Download. Lebt in `materials`.
- **Lernmodul** = online für eingeloggte Schüler:innen. `modules` mit
  `activity_kind='lernmodul'`, Unter-Variante `display_mode='quiz'|'worksheet'`.
- **Präsentation** = live am Beamer mit Schüler:innen-Geräten. `modules` mit
  `activity_kind='praesentation'`. `display_mode` für Präsentationen irrelevant.

Diese Trennung gilt ÜBERALL: Sprache, Routen, Editoren, Lehrer-Listen.
Das Wort „Modul" ist DB-/Code-Sprache; im UI sieht man entweder „Lernmodul"
oder „Präsentation". Single Source of Truth: `lib/activities.ts`.

(Detaillierter Phasen-Verlauf siehe `CHANGELOG.md`.)
