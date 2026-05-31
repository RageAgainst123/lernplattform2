# ADR-0007: Modul-Status als mehrstufige Klassifizierung statt Boolean

**Status:** accepted (in Phase 16 um die 4. Stufe `returned` erweitert, siehe ADR-0012)
**Datum:** 2026-05-29

> **Hinweis (seit Phase 16, ADR-0012):** Diese ADR beschreibt den ursprünglichen
> **3-Stufen**-Entwurf (`open` / `in_progress` / `done`). Inzwischen gibt es eine
> **4. Stufe `returned`** (von Lehrer:in zur Überarbeitung zurückgegeben). Das
> Grundprinzip dieser ADR — Status aus `student_progress` **ableiten** statt als
> Spalte zu speichern — gilt unverändert weiter; `deriveStatus()` prüft nur
> zusätzlich `returned_at`. Die unten in „Verworfen" als „heute nicht nötig"
> eingestufte 4. Stufe wurde also bewusst nachgezogen. Details: ADR-0012.

## Kontext

Bis Phase 13 wurde im Schüler:innen-Dashboard pro Modul nur unterschieden
zwischen „**erledigt**" (`AssignedModule.completed: boolean`) und „nicht
erledigt" (kein Badge). Das reicht nicht:

Eine Schüler:in, die ein Worksheet-Modul angefangen aber noch nicht
abgegeben hat, sieht **keine Markierung** — sie weiß nicht, ob sie schon
mal drin war, wo sie aufhören kann, woran sie noch dran ist. Das Dashboard
ist die Übersicht zur Selbstorganisation; ohne den Zwischenstatus „in
Bearbeitung" ist es nicht hilfreich.

Datenseitig ist die Information schon da:

- Kein `student_progress`-Row für (Schüler:in, Modul) = noch nie geöffnet
- Row existiert, `completed_at IS NULL` = begonnen, nicht abgegeben
- Row existiert, `completed_at` gesetzt = abgegeben

Fehlt nur die Klassifizierung.

## Entschieden

Den Typ `AssignedModule.completed: boolean` durch
**`status: 'open' | 'in_progress' | 'done'`** ersetzen. Klassifizierung
über eine **pure Helper-Funktion**:

```ts
// lib/db/student-modules-status.ts
export function progressStatusMap(rows: ProgressRow[]): Map<string, ModuleStatus> {
  const map = new Map();
  for (const row of rows) {
    map.set(row.module_id, row.completed_at ? 'done' : 'in_progress');
  }
  return map;
}
```

**Module ohne Row** tauchen nicht in der Map auf — der Aufrufer
(`getAssignedModules`) setzt den Default `'open'`. Damit ist die
Klassifizierung redundant aus dem Schema rekonstruierbar; kein neues
DB-Feld nötig.

Pure Helpers liegen in einer **eigenen Datei** `student-modules-status.ts`
neben `student-modules.ts` (das `'server-only'` importiert) — damit Tests
in jsdom und Client-Komponenten den Code ungestört importieren können.

Zwei Folge-Helper für die Dashboard-Anzeige in derselben Datei:

- `sortByStatus<T>(items)` — stabile Sortierung `in_progress → open → done`
- `countByStatus<T>(items)` — Zähler-Pille fürs Dashboard

## Verworfen

- **Neue Spalte `student_progress.status`** — wäre redundant zu
  `completed_at` und müsste manuell synchron gehalten werden. Klassisches
  Doppel-Truth-Source-Antipattern.
- **Client-side Schätzung aus `answers`-Größe** („wenn `answers` mindestens
  N Keys hat → in_progress") — fragil, je nach Modul-Größe falsch.
- **4 oder 5 Stufen** („begonnen", „fast fertig", „abgegeben",
  „korrigiert") — würde später vielleicht sinnvoll werden (Lehrer:innen-
  Sicht), heute nicht. Drei Stufen sind klar und genug.
- **Boolean `completed` + zusätzliches `started`-Flag** — kompliziert das
  Datenmodell für nichts. Tagging zwei Booleans ergibt dieselben drei
  Zustände wie ein Enum, aber unschöner zum Anzeigen.

## Konsequenzen

- **Breaking Change** für jeden Code, der `module.completed` liest. Alle
  Vorkommen wurden in Phase 13 angepasst:
  - `lib/db/student-modules.ts` (Typ + Rückgabe-Logik)
  - `components/student/ModuleCard.tsx` (Badge-Logik)
  - `app/s/page.tsx` (Dashboard-Page)
- **Neue Schedule-Helpers** in `lib/db/student-modules-status.ts`:
  `sortByStatus` und `countByStatus`. Werden in Phase 14 vom Dashboard
  und der Übersichts-Pille (`StatusSummary.tsx`) genutzt.
- **Tests:** 5 für `progressStatusMap`, 3 für `sortByStatus`, 2 für
  `countByStatus`. Pure Helpers → schnell und deterministisch testbar.
- **Migration zukünftig:** Wenn aus pädagogischen Gründen mehr Stufen
  nötig werden (etwa „korrigiert von Lehrer:in"), kann der Helper
  erweitert werden, ohne dass die Tabellen-Struktur sich ändert.

## Querverweise

- [`lib/db/student-modules-status.ts`](../../lib/db/student-modules-status.ts)
- [`lib/db/student-modules.ts`](../../lib/db/student-modules.ts)
- [`components/student/ModuleCard.tsx`](../../components/student/ModuleCard.tsx)
- [`components/student/StatusSummary.tsx`](../../components/student/StatusSummary.tsx)
- [`docs/INHALTSKONZEPT.md`](../INHALTSKONZEPT.md) §2b
