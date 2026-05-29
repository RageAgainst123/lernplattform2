# ADR-0006: Display-Modes — Quiz vs. Worksheet pro Modul

**Status:** accepted
**Datum:** 2026-05-28

## Kontext

Die Block-Engine (Phase 8) war zunächst ein **Quiz-Modus**: ein Block pro
Bildschirm, „Prüfen"-Button mit Sofort-Feedback grün/rot, dann „Weiter".
Pädagogisch motivierend für Wiederholungs- und Übungsphasen.

Im Schulalltag braucht es aber zusätzlich einen klassischen
**Arbeitsblatt-Modus**: alle Aufgaben auf einer Seite, frei navigierbar,
Schüler:in füllt aus, gibt am Ende ab — wie ein echtes Papier-Arbeitsblatt.
Hier ist Sofort-Feedback fehl am Platz, weil die Lehrer:in das Arbeitsblatt
einsammelt und korrigiert.

Beide Modi sollen dieselben Block-Typen nutzen (sonst doppelter
Renderer-Aufwand) und beide sollen pro Modul wählbar sein (manche EVA-
Aufgaben sind besser als Quiz, andere als Arbeitsblatt).

## Entschieden

Eine Spalte `modules.display_mode` (`text` Default `'quiz'`, CHECK
`IN ('quiz', 'worksheet')`, Migration 0006). Der **Modul-Page-Dispatcher**
(`app/s/modul/[id]/page.tsx`) wählt zur Laufzeit die passende
Runner-Komponente:

- `quiz` → `ModuleRunner.tsx` (Block-für-Block mit Sofort-Feedback)
- `worksheet` → `WorksheetRunner.tsx` (alle Blöcke auf einer Seite,
  Auto-Save, „Abgeben"-Button → definitive Read-only-Schaltung)

Block-Renderer bekommen einen neuen Prop **`readOnly: boolean`**, der
Inputs sperrt OHNE rote/grüne Bewertungs-Optik (klassisches
Arbeitsblatt-Gefühl). Bestehender `checked`-Pfad für Quiz-Bewertung bleibt
unverändert.

Im Admin-Modul-Editor wählt der Autor den Modus per Dropdown.

## Verworfen

- **Zwei separate Tabellen** (`quiz_modules` und `worksheets`) — würde
  Material/Modul-Verknüpfung und das Schüler:innen-Dashboard verdoppeln;
  keinen echten Vorteil.
- **Nur Worksheet-Modus** (Quiz weg) — würde die motivierende
  Sofort-Rückmeldung in Übungsphasen verlieren. Quiz hat seine Berechtigung.
- **Modus pro Block** (z. B. „diesen Block sofort prüfen, jenen nicht") —
  zu fein-granular, würde Schüler:innen verwirren.
- **Client-side Toggle** („du kannst das Modul auch als Worksheet öffnen") —
  würde die Lehrer:in entmündigen, weil sie den Modus didaktisch wählt.

## Konsequenzen

- `student_progress.completed_at` bekommt eine **neue Semantik**: im
  Quiz-Modus war es „alle Blöcke durchgeklickt", im Worksheet-Modus ist es
  „abgegeben". Damit kann das Dashboard beide Modi gleich behandeln.
- Server-Actions `saveWorksheetDraft` (idempotent, prüft `completed_at`)
  und `submitWorksheet` (idempotent, setzt `completed_at = now()`) leben
  parallel zu den bestehenden Quiz-Actions in `lib/db/progress-action.ts`.
- Worksheet-Modus erzwingt **Auto-Save** (800 ms debounced) — sonst
  verliert eine Schüler:in beim versehentlichen Tab-Schließen alle
  Eingaben.
- Migration 0006 ist Schema-Erweiterung, nicht Bruch — alte Module
  bekommen Default `'quiz'`, alles bleibt funktional.

## Querverweise

- [`supabase/migrations/0006_modules_display_mode.sql`](../../supabase/migrations/0006_modules_display_mode.sql)
- [`components/blocks/WorksheetRunner.tsx`](../../components/blocks/WorksheetRunner.tsx)
- [`components/blocks/ModuleRunner.tsx`](../../components/blocks/ModuleRunner.tsx)
- [`lib/db/progress-action.ts`](../../lib/db/progress-action.ts)
- [`docs/INHALTSKONZEPT.md`](../INHALTSKONZEPT.md) §2a
