# Changelog

Alle nennenswerten Änderungen an dieser Lernplattform. Reverse-chronologisch
(neueste zuerst), gegliedert nach Phasen.

Format inspiriert von [Keep a Changelog](https://keepachangelog.com/), mit
Conventional-Commit-Hashes als Anker. Daten im Format YYYY-MM-DD.

---

## Phase 14 — Rollenabhängiger Header + Dashboard-Übersicht

**2026-05-29** · Commit [`4ae4988`](#)

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

**2026-05-29** · Commit [`44b0f68`](#)

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

**2026-05-28** · Commit [`c2531c1`](#)

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

**2026-05-28** · Commit [`cd92dec`](#)

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

**2026-05-28** · Commit [`30318fd`](#)

### Hinzugefügt

- `BRAND`-Konstante (Name, baseUrl, Description) in `lib/brand.ts`.
- Akzentfarbe Blau `#2563eb` in `globals.css` (Tailwind v4 `@theme`).
- `SiteHeader` + `MobileMenu` + `SiteFooter` + `SiteShell`.
- Favicon (`app/icon.tsx` + `apple-icon.tsx`).
- Impressum-Seite (`/impressum`) + Datenschutzerklärung (`/datenschutz`).
- Pages umgestellt: `main` → `div`, `min-h-screen` → `flex-1`.

---

## Phase 9 — Öffentliche Materialbibliothek

**2026-05-28** · Commits [`bdb5f8e`](#), [`ba54c2c`](#)

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

**2026-05-26** · Commits [`0d01302`](#), [`aecdbdb`](#)

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

**2026-05-26** · Commit [`408267c`](#)

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

**2026-05-26** · Commit [`2aff303`](#)

### Hinzugefügt

- `@react-pdf/renderer` (client-only, dynamischer Import bei Klick →
  Turbopack-sicher, Helvetica offline).
- `components/teacher/CodeListPdf.tsx` + `CodeListDownloadButton.tsx`.
- Bessere Layout-Variante der PIN-Einmal-Anzeige.

---

## Phase 5 — Klassen-Verwaltung + Schüler:innen-Codes

**2026-05-26** · Commits [`9e0b5c9`](#), [`a6821c1`](#)

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

**2026-05-25** · Commit [`5822cd3`](#)

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

**2026-05-25** · Commit [`5a1e4bb`](#)

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

**2026-05-25** · Commit [`35ee830`](#)

### Hinzugefügt

- shadcn/ui via CLI (Base UI, Tailwind v4 kompatibel) mit neutralem Theme.
- Basis-Komponenten: Button, Card, Input, Label, etc.
- ESLint-Ausnahme für `components/ui/` (von Drittanbieter, nicht manuell).

---

## Phase 1 — Scaffold

**2026-05-25** · Commit [`1c1b6cb`](#)

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

**2026-05-25** · Commit [`35f9805`](#)

- Initial commit from `create-next-app`.
