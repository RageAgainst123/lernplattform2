# Changelog

Alle nennenswerten Änderungen an dieser Lernplattform. Reverse-chronologisch
(neueste zuerst), gegliedert nach Phasen.

Format inspiriert von [Keep a Changelog](https://keepachangelog.com/), mit
Conventional-Commit-Hashes als Anker. Daten im Format YYYY-MM-DD.

---

## Phase 15 — Lehrer:innen-Modul-Zuweisung + Klassen-Fortschritt-Matrix

**2026-05-29** · Commit [`f1e211e`](https://github.com/RageAgainst123/lernplattform2/commit/f1e211e)

### Hinzugefügt

- DB-Layer `lib/db/class-modules.ts` mit `getAssignedModulesForClass`
  (RLS-geschützt durch `class_modules_all_own`).
- Server-Actions `lib/db/class-module-actions.ts`: `assignModuleToClass`
  - `unassignModuleFromClass`. Beide hinter `requireUser()`.
- DB-Layer `lib/db/class-progress.ts` mit `getClassProgress` (Matrix-
  Build aus `student_codes` + `class_modules` + `student_progress`),
  plus pure Helper `cellKey` / `getCellOrOpen` / `countMatrixStatuses`.
- `getPublishedModulesAll` in `lib/db/modules.ts` (stufen-übergreifend,
  für das Klassen-Zuweisungs-Dropdown).
- UI: `components/teacher/ModuleAssignmentPanel.tsx` + ausgelagerte
  `AssignedModulesList.tsx` (Liste + Entfernen-Aktion).
- UI: `components/teacher/ClassProgressMatrix.tsx` + sticky-Spalten
  Tabelle, `ClassProgressCell.tsx` mit Status-Badge + optionalem Score.
- Neue Route `/lehrer/klassen/[id]/fortschritt` — read-only Matrix-
  Ansicht, robots=noindex.
- Klassen-Detail-Seite `/lehrer/klassen/[id]` ersetzt den bisherigen
  Placeholder durch das Modul-Panel; Page-Funktion in Sub-Komponenten
  (`ClassHeader`, `StudentCodesCard`, `ModulesCard`) zerlegt.

### Geändert

- `docs/AUTOR-WORKFLOW.md` Schritt 7+8: Modul-Zuweisung jetzt über UI
  statt SQL.

### Tests

- 213 grün (+21): `class-modules` (6), `class-progress` (6 für pure
  Helper), `ClassProgressCell` (5), `ModuleAssignmentPanel` (5 incl.
  Filter-Logik).

---

## Phase 14 — Rollenabhängiger Header + Dashboard-Übersicht

**2026-05-29** · Commit [`4ae4988`](https://github.com/RageAgainst123/lernplattform2/commit/4ae49889ef3fe88be329178697200319d24e248b)

### Hinzugefügt

- Mittlerer Header-Link ist rollenabhängig (`roleNavLink()` in `SiteHeader.tsx`):
  - Schüler:in → „Mein Bereich" → `/s`
  - Lehrer:in → „Mein Dashboard" → `/lehrer`
  - Ausgeloggt → „Schüler:innen-Login" → `/k`
- `StatusSummary`-Komponente: Zähler-Pille oben auf `/s` ("1 in Bearbeitung ·
  2 offen · 4 erledigt"), Status mit 0 Modulen ausgeblendet.
- Pure Helpers `sortByStatus` (stabile Sortierung in_progress → open → done)
  und `countByStatus` in `lib/db/student-modules-status.ts`.
- `ModuleCard` zeigt Akzentrand links (offen / in_progress), gedimmt (done),
  CTA „Starten" bzw. „Weitermachen" mit ArrowRight-Icon.
- ADR-0008 (rollenabhängiger Header-Link).

### Entfernt

- Abmelden-Button am Schüler:innen-Dashboard — lebt jetzt im Header.

### Tests

- 162 grün (+11): sortByStatus (3), countByStatus (2), StatusSummary (3),
  ModuleCard-CTA (3).

---

## Phase 13 — Schüler:innen-UX-Polish

**2026-05-29** · Commit [`44b0f68`](https://github.com/RageAgainst123/lernplattform2/commit/44b0f6873d38302f553d02dda7145c063abd58da)

### Geändert

- **Hydration-Mismatch in `FillBlankBlock` gefixt:** neuer Hook
  `useShuffled<T>()` rendert Items beim Server-Render in Originalreihenfolge
  und mischt erst nach Mount in `useEffect`.
- **Login-Status im Header sichtbar:** neue Server-Komponente
  `HeaderAuth.tsx` mit `fetchAuthSlot()` (paralleler `getUser` +
  `getStudentSession`). Eingeloggte:r Name + „Abmelden" rechts; Admin
  zusätzlich „Admin"-Link.
- **Save-Indikator im Worksheet-Banner:** 4 Zustände (idle/saving/saved/error)
  mit lucide-Icons (`SaveIcon`, `Loader2Icon`, `CheckIcon`, `AlertTriangleIcon`),
  akzent-tönt (`bg-primary/5 border-primary/20`).
- **Theorie-Blöcke visuell getrennt:** Text/Infobox bekommen `bg-muted/30` +
  „📖 Lesen"-Label; nur interaktive Blöcke werden als „Aufgabe N" gezählt.
  Pure Helper `buildTaskNumberMap` in `worksheet-task-numbers.ts`.
- **3-Stufen-Modul-Status:** `AssignedModule.completed: boolean` ersetzt
  durch `status: 'open' | 'in_progress' | 'done'`. Klassifizierung via pure
  Helper `progressStatusMap` in `lib/db/student-modules-status.ts` (kein
  neues DB-Feld).
- **`WorksheetRunner` aufgeteilt** wegen max-lines compliance:
  `WorksheetStatusBanner`, `WorksheetTaskBlock`, `useWorksheetState`,
  `worksheet-task-numbers`.
- ADR-0007 (3-Stufen-Modul-Status).

### Tests

- 151 grün (+20): useShuffled (3), WorksheetRunner (3 neue Pfade),
  SiteHeader (4 Auth-Zustände), ModuleCard (3 Badges),
  progressStatusMap (5).

---

## Phase 12 — Arbeitsblatt-Modus für Module

**2026-05-28** · Commit [`c2531c1`](https://github.com/RageAgainst123/lernplattform2/commit/c2531c15d7c137f93b2f561f38a773411fcb0386)

### Hinzugefügt

- Migration 0006: `modules.display_mode` (`text` Default `'quiz'`, Check
  `IN ('quiz','worksheet')`).
- **Worksheet-Modus:** `WorksheetRunner.tsx` — alle Aufgaben auf einer
  scrollbaren Seite, debouncierter Auto-Save (800 ms), „Abgeben"-Button mit
  Bestätigungsdialog → **definitive Abgabe**, danach Read-only.
- `readOnly`-Prop für alle 5 interaktiven Block-Renderer
  (MultipleChoice, TrueFalse, FillBlank, Match, Reflection) — sperrt Inputs
  ohne Bewertungs-Optik.
- Server-Actions `saveWorksheetDraft` (idempotent) + `submitWorksheet`
  (idempotent, setzt `completed_at`) in `lib/db/progress-action.ts`.
- Modul-Page-Dispatcher in `app/s/modul/[id]/page.tsx` rendert je nach
  `display_mode` `ModuleRunner` ODER `WorksheetRunner`.
- Admin-Editor zeigt Dropdown „Anzeige-Modus" pro Modul.
- ADR-0006 (Display-Modes Quiz vs. Worksheet).

### Geändert

- `student_progress.completed_at` ist jetzt der „abgegeben"-Marker (vorher
  beim Quiz nur „durchgeklickt").

### Tests

- 134 grün (+5).

---

## Phase 11 — Admin-Bereich + Modul-/Material-Verwaltung

**2026-05-28** · Commit [`cd92dec`](https://github.com/RageAgainst123/lernplattform2/commit/cd92dec6f155df2964ce78eec6fcbff305a6f01e)

### Hinzugefügt

- **`/admin/*`** Bereich mit Modul-Editor (3-Spalten-Layout), Material-Upload,
  Material↔Modul-Verknüpfung.
- Migration 0005: `materials.related_module_id` (FK auf modules).
- DB-Layer `lib/db/modules.ts` + `module-actions.ts`,
  `lib/db/materials.ts` + `material-actions.ts`.
- BlockList + BlockEditor + ImportJsonDialog für strukturiertes Modul-Editing.
- MaterialItem auf öffentlichen Seiten zeigt „Online ausfüllen"-Button wenn
  ein Modul verknüpft ist.
- `BRAND.adminEmails`-Allowlist in `lib/brand.ts` + `lib/auth/admin-auth.ts`.
- Proxy-Schutz für `/admin/*` (Lehrer:in-Login + Allowlist).
- `docs/ROLES.md` (Rollen-Matrix).

### Tests

- 129 grün.

---

## Phase 10 — Branding

**2026-05-28** · Commit [`30318fd`](https://github.com/RageAgainst123/lernplattform2/commit/30318fda9afd3d80ab61073162f46af59fbf3a80)

### Hinzugefügt

- `BRAND`-Konstante (Name, baseUrl, Description) in `lib/brand.ts`.
- Akzentfarbe Blau `#2563eb` in `globals.css` (Tailwind v4 `@theme`).
- `SiteHeader` + `MobileMenu` + `SiteFooter` + `SiteShell`.
- Favicon (`app/icon.tsx` + `apple-icon.tsx`).
- Impressum-Seite (`/impressum`) + Datenschutzerklärung (`/datenschutz`).
- Pages umgestellt: `main` → `div`, `min-h-screen` → `flex-1`.

---

## Phase 9 — Öffentliche Materialbibliothek

**2026-05-28** · Commits [`bdb5f8e`](https://github.com/RageAgainst123/lernplattform2/commit/bdb5f8ed8f88ac8733b1a4b0a853ce146fcc76b2), [`ba54c2c`](https://github.com/RageAgainst123/lernplattform2/commit/ba54c2cf93883b223b8cf80ffd33dda81d3fca9f)

### Hinzugefügt

- Drei Routen-Ebenen aufgebaut, dann zu zwei zusammengezogen:
  - `/dgb` — Stufenwahl
  - `/dgb/[stufe]` — Stufen-Seite mit Bereich-Accordion + inneres
    Thema-Accordion (jeweils mit Hash-Permalinks `#orientierung` oder
    `#orientierung/eva-prinzip`)
- Datenlayer `lib/db/public-content.ts` + `public-content-stufe.ts` mit
  pure Helper `groupByBereich`.
- Shadcn-Accordion-Komponente eingerichtet.
- `ThemaAccordion` + `BereichAccordion` (Client, hash-getrieben).
- `useNestedHashAccordion`-Hook für zweistufige Hash-Pfade.
- `TopicBadges` + `BereichBadges` zeigen Counts (📖 Themen / 📄 Material / ▶ Modul).
- `proxy.ts` mit Legacy-Permalink-Redirects (308) auf neue Hash-Anker.

---

## Phase 8 — Block-Engine + EVA-Demo-Modul

**2026-05-26** · Commits [`0d01302`](https://github.com/RageAgainst123/lernplattform2/commit/0d01302baa4d119367179065db6183d7f002288e), [`aecdbdb`](https://github.com/RageAgainst123/lernplattform2/commit/aecdbdb8ef94b0291027570e6e72a0c202839703)

### Hinzugefügt

- 7 Block-Renderer in `components/blocks/`:
  `TextBlock`, `InfoboxBlock`, `MultipleChoiceBlock`, `TrueFalseBlock`,
  `FillBlankBlock`, `MatchBlock`, `ReflectionBlock`.
- `BlockView`-Switch-Dispatcher.
- Block-Auswertungslogik in `lib/blocks/evaluate.ts` (Test-First).
- `ModuleRunner` — Block-für-Block-Modus (Quiz), Prüfen-Button + Sofort-
  Feedback (grün/rot), Fortschrittsbalken.
- `/s/modul/[id]` (Modul-Page) + `/s/modul/[id]/done`.
- Fortschritts-Speicherung in `student_progress` (session-gebunden,
  `score`/`max_score`/`completed_at`).
- EVA-Demo-Modul per Service-Role-REST eingespielt + der 5A-Klasse zugewiesen.

### Notizen

- Drag-Drop bewusst als „Tippen" implementiert (touch-/barrierearm). Abweichung
  vom Manifest, ggf. ADR.

---

## Phase 7 — Schüler:innen-Login

**2026-05-26** · Commit [`408267c`](https://github.com/RageAgainst123/lernplattform2/commit/408267c18385a14525fd88cf310f84e074290ecb)

### Hinzugefügt

- Migration 0003: `classes.join_code` (kurzer 6-stelliger Code aus
  Alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` — kein `0/O/1/I/L`).
- Eigenes Session-System (NICHT Supabase Auth):
  - `/k` Code-Eingabe → `/k/[code]` Codename-Dropdown + PIN → `verifyPin`
    gegen bcrypt-Hash → signiertes HTTP-Only-Cookie (jose HS256, 8h)
- `lib/auth/student-session.ts` (Test-First), `lib/auth/student-auth.ts`.
- `proxy.ts` schützt `/s/*` (jose) UND `/lehrer/*` (Supabase) parallel.
- `lib/supabase/admin.ts` (Service-Role-Client, **server-only**) für
  Schüler:innen-Queries ohne `auth.uid()`.
- `SESSION_SECRET` + `SUPABASE_SECRET_KEY` in `.env.local`.

---

## Phase 6 — PDF-Export der Code-Liste

**2026-05-26** · Commit [`2aff303`](https://github.com/RageAgainst123/lernplattform2/commit/2aff303a1a89ba44c5f7a2711d41e816117f3fa4)

### Hinzugefügt

- `@react-pdf/renderer` (client-only, dynamischer Import bei Klick →
  Turbopack-sicher, Helvetica offline).
- `components/teacher/CodeListPdf.tsx` + `CodeListDownloadButton.tsx`.
- Bessere Layout-Variante der PIN-Einmal-Anzeige.

---

## Phase 5 — Klassen-Verwaltung + Schüler:innen-Codes

**2026-05-26** · Commits [`9e0b5c9`](https://github.com/RageAgainst123/lernplattform2/commit/9e0b5c946f1bd9c16ead4a144507ae94bb9a0008), [`a6821c1`](https://github.com/RageAgainst123/lernplattform2/commit/a6821c1da9fe0f356fe3fc57c65a77aed7ff5575)

### Hinzugefügt

- DB-Layer `lib/db/classes.ts` + `class-actions.ts`.
- `/lehrer/klassen` (Liste), `.../neu` (anlegen), `.../[id]` (Detail).
- `bcryptjs` installiert; `lib/auth/pin.ts` (Test-First, SALT_ROUNDS=10).
- Code-Generierungs-Logik (`5A-01`-Format) in `lib/db/codename.ts` (Pure-Helper,
  getestet).
- Server Actions: Codes generieren, PIN neu generieren.
- UI: Codes generieren + Liste + **Einmal-Anzeige** der frisch generierten
  PINs (PLATTFORM_MANIFEST Hard Rule #10: Klartext-PIN nie persistiert).

---

## Phase 4 — Lehrer:innen-Login (Magic Link)

**2026-05-25** · Commit [`5822cd3`](https://github.com/RageAgainst123/lernplattform2/commit/5822cd3a01a243660f6e152eab2b8dd27d08cc9e)

### Hinzugefügt

- `/login` (Magic-Link anfordern via `signInWithOtp`).
- `/auth/confirm` (token_hash-Flow via `verifyOtp`).
- Geschütztes `/lehrer`-Dashboard.
- `lib/auth/teacher-auth.ts` mit `getUser` + `ensureTeacherProfile`
  (Auto-Anlage des Profils beim ersten Login).
- Logout-Server-Action in `lib/auth/actions.ts`.
- `proxy.ts` (Routenschutz für `/lehrer`).

---

## Phase 3 — Supabase-Schema + RLS

**2026-05-25** · Commit [`5a1e4bb`](https://github.com/RageAgainst123/lernplattform2/commit/5a1e4bbd9b6c622f1b8dbb8deb6a29d8c97f37fa)

### Hinzugefügt

- Migration 0001: 7 Haupttabellen
  (`teachers`, `classes`, `student_codes`, `modules`, `materials`,
  `class_modules`, `student_progress`).
- Migration 0002: Row-Level-Security-Policies (eigene Daten / publizierte
  Inhalte / Service-Role-Bypass).
- TypeScript-Types + Zod-Schemas (`lib/schemas/`, `types/`).
- Supabase-Clients: `client.ts` (Browser), `server.ts` (Server),
  `middleware.ts` (Cookie-Refresh, via `proxy.ts` aufgerufen).
- `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## Phase 2 — shadcn/ui-Setup

**2026-05-25** · Commit [`35ee830`](https://github.com/RageAgainst123/lernplattform2/commit/35ee83086dad5a03673f8ac7f630c677db4254a3)

### Hinzugefügt

- shadcn/ui via CLI (Base UI, Tailwind v4 kompatibel) mit neutralem Theme.
- Basis-Komponenten: Button, Card, Input, Label, etc.
- ESLint-Ausnahme für `components/ui/` (von Drittanbieter, nicht manuell).

---

## Phase 1 — Scaffold

**2026-05-25** · Commit [`1c1b6cb`](https://github.com/RageAgainst123/lernplattform2/commit/1c1b6cba50a363b993b884937155e290060c84e0)

### Hinzugefügt

- Next.js 16 (App Router, Turbopack) in-place gescaffoldet (kein `src/`).
- Tailwind CSS v4 (CSS-basiertes `@theme`).
- TypeScript strict (`tsconfig.json`).
- ESLint strict-Regeln (`max-lines: 200`, `max-lines-per-function: 50`,
  `complexity: 10`, `no-any`).
- Prettier (2-Space-Indent).
- Vitest + Testing Library + jsdom + Sanity-Test.
- Husky + lint-staged + CommitLint (lowercase Conventional Commits).
- GitHub Actions CI (lint / format / typecheck / test / build).
- Coverage-Tooling.
- `README.md`, `docs/adr/0001-0005`.

---

## Vor Phase 1

**2026-05-25** · Commit [`35f9805`](https://github.com/RageAgainst123/lernplattform2/commit/35f9805d62494a7d9b2813e8e15690b3ab969914)

- Initial commit from `create-next-app`.
