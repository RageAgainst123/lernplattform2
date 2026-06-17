# Content-Authoring-Audit — lernplattform2

> **Audit-Datum:** 2026-06-05 · **Auditor:** 3 parallele Claude-Subagents
> **Stand:** post-U2 (Pre-Launch-Security komplett, Content-Pipeline noch nicht produktionsreif)
> **Ziel:** Modul-Editor, Lernpfade, Word-Heft auf Production-Qualität bringen
> **Was es NICHT ist:** Vollständige Spec — eine Roadmap mit Befunden + Severity + Aufwand.

Drei Audits liefen parallel:

1. **Modul-Editor** — Block-Form-Coverage, Vorschau, Duplikation, Bild-Picker, Validierung
2. **Lernpfade** — Lehrplan-Alignment, Schüler-/Lehrer-UX, `class_topics`-Tote-Tabelle, Public-Browser
3. **Word-Heft** — Onboarding, Layout-Bugs, Doppel-Heft-Problem, Lehrer-Workflow

---

## 🚨 CRITICAL — Echte Bugs, die sofort fixen

### EDIT-CRIT-1 — Editor lässt „kaputte" Module live schalten

**File:** `lib/schemas/blocks.ts` vs `scripts/validate-module.mjs`
**Befund:** Das Zod-Schema kennt fachliche Regeln NICHT. Ein MC-Block mit 0 `correct: true` ist Zod-konform → wird gespeichert + veröffentlicht → Schüler:in bekommt nie Punkte. Gleiches Problem für: fill_blank-Platzhalter ≠ solutions.length, match mit nur 1 Kategorie.

Das CLI-Skript `validate-module.mjs` macht diese Checks — aber **nur beim JSON-Import**, nicht beim Form-Edit im Editor.

**Fix:** Die `.superRefine()`-Checks aus `validate-module.mjs` ins Zod-Schema heben. Single Source of Truth. (**Aufwand S**)

### PFAD-CRIT-1 — `class_topics`-Tabelle existiert, wird aber nicht benutzt

**File:** `lib/db/class-topic-actions.ts:35-67` (`assignTopicToClass`) + Migration `0013_topics_and_ordering.sql:79-93`
**Befund:** `assignTopicToClass` schreibt nicht in die `class_topics`-Tabelle (für die die Migration angelegt wurde), sondern hydratisiert alle Module einzeln in `class_modules`. Konsequenzen:

- Neue Module eines Topics erscheinen NICHT automatisch in Klassen, die das Topic schon zugewiesen haben.
- Kein Trail „diese Klasse hat Topic X" → Reporting unmöglich.
- Migration ist tote Infrastruktur.

**Fix:** `assignTopicToClass` refactoren — schreibt in `class_topics`, `getAssignedTopicsForClass` joint über `class_topics` → `modules` (live). (**Aufwand L** — Datenmodell-Refactor)

### PFAD-CRIT-2 — Public-Browser (`/dgb/*`) umgeht `topics`-Entity komplett

**File:** `lib/db/public-content-stufe.ts:76-113`
**Befund:** Selektiert direkt aus `materials.topic` und `modules.topic` (Freitext-Felder) statt aus der `topics`-Tabelle. Konsequenzen:

- `topics.description` ist öffentlich unsichtbar.
- `topics.is_published=false` wird ignoriert → Entwurf-Topics „lecken" über Module-Strings nach außen.
- `topics.sort_order` ignoriert.
- Keine deeplink-baren URLs (`/dgb/[stufe]/[bereich]/[slug]` existiert nicht).

**Fix:** `public-content-stufe.ts` auf `topics`-Tabelle umstellen + `/dgb/[stufe]/[bereich]/[slug]/page.tsx` bauen. (**Aufwand L**)

### HEFT-CRIT-1 — Doppel-Header-Link für SSO-Schüler:innen

**File:** `app/s/layout.tsx:21-28`
**Befund:** Alle Schüler:innen (auch SSO) sehen den Header-Link „📓 Mein Heft → /s/heft" (Tiptap). `SiteHeader.tsx` rendert ZUSÄTZLICH „📓 Mein Heft → /s/heft/word" für SSO. → SSO-Schüler:in sieht **zwei Links mit gleichem Icon + Label**, die zu zwei verschiedenen Hefen führen.

ADR-0015 hat klar entschieden: „O365-Schüler:innen sehen Tiptap NICHT".

**Fix:** Conditional in `app/s/layout.tsx`: `isSso ? null : <heft-link>` (oder ganz aus Layout-Header rausnehmen, da SiteHeader die Logik schon hat). (**Aufwand S**)

### HEFT-CRIT-2 — Code+PIN-Schüler:innen sehen GAR KEINEN Heft-Hint auf Themen

**File:** `app/s/thema/[slug]/page.tsx:58`
**Befund:** `{isSso && <WordHeftHint…/>}` — Code+PIN-Schüler:innen (die das Tiptap-Heft nutzen müssen) bekommen keine Erinnerung „schreibe ins Heft" auf Themen-Seiten. Schwächt das Heft-Konzept für die Hälfte der Zielgruppe.

**Fix:** Zweite Hint-Variante „TiptapHeftHint" für `!isSso`, linkt zu `/s/heft/neu` oder `/s/heft`. (**Aufwand S**)

---

## ⚠ HIGH — Wirklich nötig vor Test-Klassen

### EDIT-HIGH-1 — 5 Live-Block-Typen sind JSON-only

**Files:** `components/admin/forms/BlockForm.tsx` (nur 7 von 13 Typen)
**Befund:** Geo muss für `slide`, `live_poll`, `quiz_poll`, `word_cloud`, `scale`, `understanding` JSON-Snippets bearbeiten. Der gesamte Präsentations-Workflow ist Autoren-feindlich.

**Fix:** 5 Form-Builder. `quiz_poll` kann `MultipleChoiceForm` 1:1 wiederverwenden. `live_poll` = `MultipleChoiceForm` ohne `correct`. `slide` analog zu `TextForm` mit Titel+Body. (**Aufwand M**)

### EDIT-HIGH-2 — Kein Auto-Save + kein Unsaved-Warnings

**Files:** `components/admin/ModuleEditor.tsx`
**Befund:** Geo muss bei jedem Tick den Speichern-Button drücken. Tab-Wechsel oder Browser-Crash → alles weg. Kein `beforeunload`-Handler.

**Fix:** Debounced `updateModule` alle ~1.5s + „Gespeichert vor 3s"-Indikator + `beforeunload`-Warnung wenn unsaved. (**Aufwand M**)

### EDIT-HIGH-3 — Kein Modul-Duplizieren-Button

**File:** `lib/db/module-actions.ts` (`duplicateModule` fehlt) + Listen-Pages
**Befund:** „EVA-Modul für 6. Stufe" als Vorlage für „7. Stufe" → Geo muss JSON exportieren+importieren oder neu eintippen. Auch Block-Duplikat (z.B. „MC mit 4 Antworten kopieren und nur Frage ändern") fehlt.

**Fix:** Server-Action `duplicateModule(id)` + Listen-Button. Plus Block-Duplicate-Icon in `BlockList.tsx`. (**Aufwand S**)

### EDIT-HIGH-4 — Kein Bild-Picker für Autor (Pexels existiert für Schüler-Heft!)

**Files:** `components/admin/forms/TextForm.tsx`, `SlideForm.tsx` (wenn gebaut)
**Befund:** Geo bekommt nur ein URL-Textfeld für `imageUrl`. Schüler:innen haben einen `ImagePickerDialog.tsx` mit Pexels-Suche. Inkonsistent — Geo muss Browser-Tab öffnen → Bild suchen → URL kopieren.

**Fix:** `ImagePickerDialog` in `TextForm` + `SlideForm` einbinden. `searchImagesAction` existiert schon. (**Aufwand S**)

### EDIT-HIGH-5 — Edit an publiziertem Modul ohne Warnung kaputt Schüler-Daten

**Files:** `lib/db/module-actions.ts`, ModuleEditor
**Befund:** Geo löscht eine MC-Option, deren `option_id` schon gespeicherte Antworten hat → Antworten zeigen ins Leere, evaluate findet die Option nicht → Score wird falsch berechnet. Kein „⚠ N Schüler:innen haben dieses Modul bereits bearbeitet"-Banner.

**Fix:** Beim Edit-Page-Load Query auf `student_progress.module_id` → Banner falls >0. (**Aufwand S**)

### PFAD-HIGH-1 — Klassen-Fortschrittsmatrix kennt keine Topics

**Files:** `app/lehrer/klassen/[id]/fortschritt/page.tsx`, `components/teacher/ClassProgressMatrix.tsx`
**Befund:** Flache Modul-Spalten ohne Topic-Gruppierung. „Klasse 1a hat 3 von 5 Themen abgeschlossen" ist nicht ablesbar. Damit das Lehrplan-Konzept tatsächlich sichtbar wird, braucht es Topic-Gruppen.

**Fix:** Matrix gruppiert Spalten nach Topic + Topic-Subheader mit „N/M abgeschlossen"-Pill. (**Aufwand M**)

### PFAD-HIGH-2 — Lehrplan-Alignment möglicherweise inhaltlich falsch

**File:** `lib/curriculum.ts:10-16`, `lib/schemas/entities.ts:9-15`, `docs/INHALTSKONZEPT.md`
**Befund:** Enum hat **5 Kompetenzbereiche** (`orientierung | information | kommunikation | produktion | handeln`). BGBl II 267/2022 listet je nach Lehrplan-Version **6 oder 7**. Code/DB/Doku sind konsistent — aber möglicherweise konsistent falsch.

**Fix:** Geo gegen BGBl-Lehrplan-Tabelle verifizieren. Wenn Korrektur nötig: Enum-Migration + Backfill. (**Aufwand M** wenn Korrektur)

### PFAD-HIGH-3 — Topic-Delete ohne Klassen-Warnung

**File:** `lib/db/topic-actions.ts:58-70`
**Befund:** `deleteTopic` löscht ohne zu prüfen ob Klassen zugewiesen. Schüler:innen sehen plötzlich ihre Themen-Karten nicht mehr (Filter `topic_id` in `student-topics.ts:88`).

**Fix:** Vor Delete: Query auf `class_topics.topic_id` → Confirmation-Dialog „Topic X ist N Klassen zugewiesen — wirklich löschen?". (**Aufwand S**)

### PFAD-HIGH-4 — Differenzierung 5./6./7./8. SSt. nicht im Topic-Modell

**File:** `lib/schemas/entities.ts` — `topics.schulstufe: number | null`
**Befund:** Ein Topic gehört zu genau einer Stufe. „EVA-Prinzip" für 5. UND 6. Stufe = zwei separate Topic-Datensätze. Bei 4 Stufen × 5 Bereichen × ~5 Themen = ~100 Topics, viele inhaltlich identisch.

**Fix:** `topics.applies_to_stufen: number[]` Array (oder M:N-Tabelle). (**Aufwand L**)

### HEFT-HIGH-1 — Onboarding-Anleitung ohne Screenshots

**File:** `components/student/WordHeftInstructionsModal.tsx`
**Befund:** 7 Schritte rein textuell. Schritt 4 („⚙️-Zahnrad neben Link kopieren") ist die kritische Microsoft-UI-Stelle und genau die, die ohne Bild schwer zu finden ist. Real-World-Fehlerrate vermutlich >30%.

**Fix:** 2-3 Screenshots (Schritte 4, 5, 7) als Asset einbinden. Geo kann Screenshots schnell selbst machen. (**Aufwand M**)

### HEFT-HIGH-2 — Lehrer-Heft-Übersicht zeigt `last_opened_at` nicht

**File:** `components/teacher/WordHeftMatrix.tsx`
**Befund:** DB pflegt `last_opened_at` + `updated_at`, UI zeigt nichts davon. Lehrer:in sieht nicht „wer hat das Heft seit 3 Wochen nicht geöffnet". Auch keine „X von Y haben Heft eingerichtet"-Pill.

**Fix:** Spalte „zuletzt geöffnet" + Header-Pill „3 von 18 Schüler:innen haben kein Heft". (**Aufwand S**)

---

## 🔍 MEDIUM — Quality of Life

### EDIT-MED-1 — Vorschau zeigt nur einzelne Blocks, nicht den ganzen Modul-Flow

`LivePreview.tsx` zeigt Block für Block via `BlockView`. Geo sieht nicht wie der `displayMode` (Quiz vs. Worksheet) als Ganzes aussieht oder wie der Beamer-Modus rendert.
**Fix:** Display-Mode-Toggle im Preview-Tab das `ModuleRunner`/`WorksheetRunner`/Beamer einbettet. (**Aufwand M**)

### EDIT-MED-2 — Kein Drag-Drop für Block-Reorder, nur ↑/↓-Buttons

Bei 15+ Blocks zermürbend.
**Fix:** `@dnd-kit/core` wieder hinzufügen (war eh schon installiert, in U2 entfernt) und in `BlockList` einbauen. (**Aufwand M**)

### PFAD-MED-1 — Kein „mein Fortschritt"-Dashboard für Schüler

`/s` zeigt zugewiesene Themen, aber kein „X von Y Themen abgeschlossen" oder Streak.
**Fix:** Stat-Cards auf `/s`. (**Aufwand M**)

### PFAD-MED-2 — Kein „Wiederholen"-Modus für `done`-Module

Klick auf abgeschlossenes Modul = vorherige Antworten oder von vorn? Verhalten unklar.
**Fix:** Read-only-„Antworten ansehen"-Modus + separater „Erneut versuchen"-Button. (**Aufwand M**)

### PFAD-MED-3 — Abschlusstest ohne Versuchs-Begrenzung

Schüler:in kann beliebig oft neu beginnen. Bei Test mit Bewertung ein Loch.
**Fix:** `attempt_count`-Feld + Cap pro Klasse-Setting. (**Aufwand M**)

### PFAD-MED-4 — Lehrer:in kann keine Hintergrund-Materialien pro Topic hinterlegen

`topic.description` ist Schüler-orientiert. Kein Feld `teacherNotes`, kein Lehrer-only-Material-Tab.
**Fix:** `topics.teacher_notes` (text) + Lehrer:in-Sicht in `/lehrer/klassen/[id]/thema/[slug]`. (**Aufwand M**)

### PFAD-MED-5 — Lernziele nicht explizit modelliert

Keine `topic.learning_objectives`. THEMA-WORKFLOW erwähnt „eine Lehrplan-Kompetenz" pro Topic — nicht maschinenlesbar.
**Fix:** Array-Feld + UI. (**Aufwand M**)

### HEFT-MED-1 — Personal-MS-Konto vs. Schul-Tenant ohne Warnung

`validateOneDriveLink` akzeptiert `onedrive.live.com` + `1drv.ms` (private Konten). Lehrer:in kommt vermutlich nie rein.
**Fix:** Warnhinweis vor Speichern wenn Host private-MS. (**Aufwand S**)

### HEFT-MED-2 — Re-Validierung bei Lehrer:in-Klick fehlt

Wenn Schüler:in die Datei löscht oder Sharing entzieht → `validation_status` bleibt auf altem Wert.
**Fix:** Server-Action `revalidateLink` + Trigger bei Lehrer:in-Klick. (**Aufwand M**)

### HEFT-MED-3 — Datenschutz-Hinweis zu Username in URL

OneDrive-URL enthält `nms-pitten-my.sharepoint.com/personal/<vorname.nachname>/…` — personenbezogen.
**Fix:** Hinweis in `app/datenschutz/page.tsx`. (**Aufwand S**)

---

## 🧹 NICE-TO-HAVE / später

- Block-Snippets-Bibliothek („Mein Standard-Reflexions-Block")
- Multi-Stufen-Module (M:N-Tabelle `module_grades`)
- Undo/Redo im Editor
- Pflicht/Optional-Markierung pro Modul
- Word-Heft-Vorlage als `.docx`-Download
- Heft-PDF-Export am Schuljahres-Ende
- Tooltip „Tipp: in Word → Datei → Drucken"
- `useHeftMode()`-Helper als Single Source of Truth (statt `isSso`-Checks an 3 Stellen)
- writing-prompts (laut Audit-Brief erwartet, existiert nicht — separate Phase wenn gebraucht)

---

## 🎯 Priorisierte Roadmap

### **Phase V — Quick-Wins (~4-6 h, sofort sinnvoll)**

Schnelle Fixes mit echtem Impact. Kein Datenmodell-Refactor.

| #   | Befund                                                    | Aufwand    | Wert                                       |
| --- | --------------------------------------------------------- | ---------- | ------------------------------------------ |
| V1  | **HEFT-CRIT-1** Header-Doppel-Link-Bug                    | S (15 min) | Behebt UX-Verwirrung sofort                |
| V2  | **HEFT-CRIT-2** Code+PIN-Hint auf Themen                  | S (30 min) | Macht Heft-Konzept für die Hälfte sichtbar |
| V3  | **EDIT-CRIT-1** Fachliche Validierung ins Zod-Schema      | S (45 min) | Verhindert kaputte Module                  |
| V4  | **EDIT-HIGH-3** Modul-Duplizieren-Button                  | S (30 min) | Spart Geo viel Tippen                      |
| V5  | **EDIT-HIGH-5** „N Schüler haben bereits begonnen"-Banner | S (30 min) | Verhindert Daten-Korruption                |
| V6  | **PFAD-HIGH-3** Topic-Delete-Warnung                      | S (20 min) | Verhindert kaputte Klassen                 |
| V7  | **HEFT-HIGH-2** `last_opened_at` + Pill in Lehrer-Matrix  | S (45 min) | Sofort nutzbares Reporting                 |
| V8  | **HEFT-MED-1** Personal-MS-Konto-Warnung                  | S (15 min) | Verhindert eine Debug-Klasse               |
| V9  | **EDIT-HIGH-4** Bild-Picker für TextForm                  | S (30 min) | Konsistenz Schüler-↔-Autor                 |

**Total V: ~4-5h. Danach sind alle CRITICALs weg + die wichtigsten Reibungspunkte im Authoring.**

### **Phase W — Workflow-Erweiterungen (~8-12 h)**

Mehr Ingenieur-Arbeit aber kein Datenmodell-Reset.

| #   | Befund                                                  | Aufwand                   |
| --- | ------------------------------------------------------- | ------------------------- |
| W1  | **EDIT-HIGH-1** 5 Form-Builder für Live-Blocks          | M (3h)                    |
| W2  | **EDIT-HIGH-2** Auto-Save + Unsaved-Warnung             | M (2h)                    |
| W3  | **EDIT-MED-1** Display-Mode-Preview                     | M (2h)                    |
| W4  | **EDIT-MED-2** Drag-Drop Block-Reorder                  | M (2h)                    |
| W5  | **PFAD-HIGH-1** Topic-Gruppierung in Fortschrittsmatrix | M (2h)                    |
| W6  | **HEFT-HIGH-1** Onboarding-Screenshots                  | M (1h Code + Screenshots) |
| W7  | **HEFT-MED-2** Re-Validierung bei Lehrer-Klick          | M (1h)                    |

### **Phase X — Datenmodell-Refactor (~12-16 h, gut planen)**

Brauchen Migrationen + DB-Tests. Erst nach Phase V+W.

| #   | Befund                                                           | Aufwand                     |
| --- | ---------------------------------------------------------------- | --------------------------- |
| X1  | **PFAD-CRIT-1** `class_topics` aktivieren                        | L (4h)                      |
| X2  | **PFAD-CRIT-2** Public-Browser auf topics-Tabelle + Detail-Route | L (4h)                      |
| X3  | **PFAD-HIGH-4** Multi-Stufen-Topics                              | L (3h)                      |
| X4  | **PFAD-HIGH-2** Lehrplan-Alignment verifizieren + ggf. Migration | M (2h, abhängig vom Befund) |
| X5  | **PFAD-MED-3** Abschlusstest-Versuchs-Tracking                   | M (3h)                      |
| X6  | **PFAD-MED-4+5** Teacher-Notes + Lernziele-Felder                | M (3h)                      |

---

## 💡 Architektur-Empfehlungen

### Word-Heft vs Tiptap-Heft: koexistieren

- Tiptap-Heft kann **nicht** sunset werden solange Code+PIN-Schüler:innen existieren (Volksschule, A1 ohne O365, Vertretung). ADR-0014 hält Code+PIN explizit als gleichberechtigt.
- **Beide pflegen** geht auch nicht: doppelte UI-Last, „Welches Heft ist meines?" wird zur Dauerfrage.
- **Mittelweg:** Tiptap bleibt funktional aber Feature-Freeze. Word-Heft bekommt die Roadmap-Energie. Trennung pro Identität (`isSso`) muss an **einer** Stelle konsequent gezogen werden.
- **Konkret:** `useHeftMode(): 'word' | 'tiptap'`-Helper auf Server-Seite, von Layout/Hint/Matrix gemeinsam konsumiert.

### Editor-Validierung: Single Source of Truth

Aktuell leben fachliche Regeln dreifach:

1. **Spec** (`docs/MODUL-SPEZIFIKATION.md`) — Doku
2. **Validate-Skript** (`scripts/validate-module.mjs`) — CLI/Pre-Import
3. **Editor-Save** (`ModuleEditor.handleSave` → Zod) — wo es zählt

→ Ins Zod-Schema heben mit `.superRefine()`. Skript ruft das gleiche Schema. Editor auch. Doku zeigt nur, was das Schema ohnehin garantiert.

### Lernpfade: `class_topics` als first-class

Aktueller Bypass (Module einzeln in `class_modules` zu kopieren) blockiert alle Topic-übergreifenden Features. Sobald X1 (Phase X) gemacht ist, werden W5 (Topic-Gruppierung in Matrix), M5 (Teacher-Notes pro Topic) etc. natürlich.

---

## Was ich dir empfehle

**Wenn du heute weitermachst (~5h):** Phase V komplett. Danach sind alle CRITICALs weg und Geo's Authoring-Workflow ist deutlich smoother.

**Wenn du eine Woche Zeit hast:** V + W. Danach ist die Authoring-Pipeline production-ready für eigene Test-Phase.

**Wenn du tiefer ran willst:** V + W + X1 (`class_topics`-Refactor). Das ist der größte Architektur-Hebel — danach ist die Lernpfad-Idee endlich wirklich konsistent gebaut.

**NICHT empfehlen:** Phase X1+X2 ohne vorher V+W zu machen. Du würdest am Datenmodell rumschrauben, während die UX-Reibungspunkte weiter bestehen — falsche Reihenfolge.
