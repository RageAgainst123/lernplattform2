# Changelog

Alle nennenswerten Änderungen an dieser Lernplattform. Reverse-chronologisch
(neueste zuerst), gegliedert nach Phasen.

Format inspiriert von [Keep a Changelog](https://keepachangelog.com/), mit
Conventional-Commit-Hashes als Anker. Daten im Format YYYY-MM-DD.

---

## Phase M/CW — Spiel-Blöcke `memory` + `crossword` & „Als Schüler:in testen"-Tab

**2026-06-12** · Tags `block-memory`, `block-crossword` · Commits `66a1e8c`…`3e0a55f`

### „🎒 Als Schüler:in testen"-Tab im Lernmodul-Editor (`66a1e8c`)

- Dritter Editor-Tab neben „Blöcke" und „Vorschau": spielt das Modul **exakt
  in der Schüler-Sicht** durch — Quiz-Modus Block-für-Block mit Prüfen/Weiter,
  Worksheet-Modus alle Aufgaben + „Abgeben". Simulierte Score-Auswertung in
  Prozent + „Neu starten". Keine DB-Schreibung, kein zweiter Browser/Login.
- Nur für Lernmodule (Präsentationen testet man am Beamer). Komponenten:
  `StudentTestPanel` + `student-test-quiz` (nutzt denselben
  `useModuleRunner`-Hook wie die Produktion).

### Neuer Block-Typ `memory` — Paare-Spiel (`0dc94be`)

- Karte antippen, zweite Karte antippen — passt das Paar, bleibt es offen,
  sonst klappt es nach ~0,7 s zurück. Karten tragen **Text ODER Bild**
  (Pexels/Upload) → Begriff–Begriff, Begriff–Definition, Begriff–Bild.
  3–8 Paare, Antwort `string[]` (gematchte pairIds), **Teilpunkte** =
  gefundene Paare / Anzahl Paare.
- End-to-end registriert: Schema (`blocks-memory.ts`), Grading
  (`PARTIAL_GRADERS`), Renderer (`MemoryBlock` + Flip-Hook), `MemoryForm`,
  Stub/Katalog/Validate (Karte genau `text` XOR `imageUrl`).
- Bugfix unterwegs: Karten-Liste via `useMemo` stabil referenziert — ohne
  das löste `useShuffled` einen Endlos-Re-Render-Loop aus (hängende Tests).

### Neuer Block-Typ `crossword` — Kreuzworträtsel (`fd43273`, Optik `3e0a55f`)

- Autor:in legt Wörter mit Frage, Richtung und Startzelle aufs Gitter
  (2–15×2–15, 2–10 Wörter); die füllbaren Zellen werden **abgeleitet**,
  Kreuzungen müssen im Buchstaben übereinstimmen (Schema + Validate +
  **Live-Editor-Vorschau mit Konflikt-Warnung** teilen dieselbe Ableitung
  `lib/blocks/crossword-grid.ts`). Schüler:in tippt Zellen an und gibt
  Buchstaben ein — Auto-Advance entlang des Worts, Re-Tap auf Kreuzungen
  wechselt die Richtung. Antwort `Record<"r,c",Buchstabe>`, **Teilpunkte** =
  richtige Zellen / füllbare Zellen (zell-basiert, case-insensitiv).
- Optik wie gedrucktes Rätsel: blockierte Zellen unsichtbar, aktives Wort
  blau hinterlegt, Startzellen-Nummern, kräftige grün/rot-Bewertung.

### Fixes

- **`LERNMODUL_BLOCKS`-Filter** (`bfedb37`): `label_image`/`memory`/`crossword`
  fehlten in der Aktivitäts-Allowlist → erschienen nicht im „Block
  hinzufügen"-Dialog (label_image schon seit A3.8). Schutzwall-Test erweitert.
- **`hint`/`maxAttempts` generisch** (`3e0a55f`): der Quiz-Runner las beide
  Felder nur für 4 alte Typen (mc/tf/fill_blank/match) — jetzt für **alle**
  bewertbaren Blöcke („Nochmal versuchen" + HintBox funktionieren damit auch
  bei hotspot, label_image, memory, crossword, categorize, mark_words, order).
- Test-Draft `supabase/seeds/_drafts/test-memory-crossword.json` (`a5f7fb8`)
  zum Import-Ausprobieren beider Typen (mit `hint` + `maxAttempts: 3`).

---

## Phase A3.7/A3.8 — Versteckte Zonen, „Bild-Beschriften", Kontrast-Politur

**2026-06-10** · Tags `phase-a3-7…a3-12-savepoint`

### A3.7 — Hotspot: versteckte Zonen + Frei-Klick + Feedback

- **`revealZones`** (Default `true`): `false` versteckt die Zonen-Rahmen →
  Schüler:in klickt **frei** aufs Bild („Finde das Objekt"). Anti-Raten-Design:
  neutrale Marker pro Klick, Auflösung erst beim Prüfen. Optionales **`maxClicks`**-
  Limit. Pure Hit-Test-Helfer `pointInArea`/`hitAreaIds` (Renderer + Editor geteilt).
- **`zoomable`** (Default `false`): Bild zoom-/verschiebbar für detailreiche Bilder.
- Pro-Zone-**`feedback`** (Erklärtext nach dem Prüfen) + Label-Popup im Editor
  (Begriff/Gruppe direkt an der Zone setzen).

### A3.8 — Neuer Block-Typ `label_image` („Bild-Beschriften")

- Schüler:in ordnet jeder Stelle im Bild den **richtigen Begriff** zu (Zone
  tippen → Begriff-Chip wählen, kein Drag&Drop). Antwort `Record<zoneId,label>`,
  **Teilpunkte** (richtig beschriftete Zonen / Anzahl Zonen). Sichtbarer Marker-
  und versteckter Frei-Klick-Modus, `zoomable`.
- End-to-end registriert: Schema (`blocks-label-image.ts` + neue
  `blocks-shared.ts`), Grading (`PARTIAL_GRADERS`), Renderer + Dispatch,
  Admin-Editor `LabelImageForm` (Hotspot-Editor-Bausteine generisch gemacht),
  Stub/Katalog/Validate-Script. Validate erzwingt **eindeutige Begriffe**.
- Showcase-Lernmodul um `label_image` erweitert (Seed `0007` aktualisiert).

### Kontrast-Politur (Audit-Befunde)

- **Zonen-Marker** mit dickerem Rand + dunklem Drop-Shadow → auch auf hellem
  Bildhintergrund (z. B. Holztisch) sichtbar.
- **Bewertungs-Overlays** transparenter (`/12`-Tint statt `/30`) + `border-4` →
  das Objekt unter der Zone bleibt erkennbar, Bewertung trotzdem eindeutig.

---

## Phase A3+ — Hotspot-Ausbau: Formen, Rotation, Gruppen, testbare Vorschau

**2026-06-07** · Tags `phase-a3-1/a3-2/a3-3-savepoint`

Nach Geos Admin-Test des Basis-Hotspots in drei rückwärtskompatiblen Schritten
ausgebaut (keine DB-Migration; Antwortformat bleibt `string[]`):

### A3.1 — Bug-Fix + testbare Vorschau

- Editor: Umschalter „neue Zone richtig/Ablenker“ (Default richtig) — mehrere
  grüne Zonen sind jetzt offensichtlich möglich. Klarerer Hilfetext.
- **LivePreview „Prüfen“-Knopf** mit Bewertungsanzeige (grün/gelb/rot +
  Teilpunkte) + Zurücksetzen + optionale HintBox — **generisch für ALLE
  bewertbaren Block-Typen**. Autor:in testet im Editor, ohne Test-Login.

### A3.2 — Rechteck-Zonen + Rotation

- Zonen können Kreise oder **Rechtecke** sein und beliebig **gedreht** werden.
- Schema additiv (`shape`/`width`/`height`/`rotation` mit Zod-Defaults) → alte
  Zonen (nur x/y/r/isCorrect) bleiben gültig. Pure `hotspot-geometry.ts` von
  Renderer + Editor geteilt. Editor: Rechteck per Aufziehen, Slider-Feintuning.

### A3.3 — Gruppen-Modus

- Ein Bild, mehrere Frage-Schritte: „Tippe alle Eingabegeräte an“ → prüfen →
  „Tippe alle Ausgabegeräte an“. Bewertung pro Gruppe, Gesamt = Durchschnitt.
  `block.groups` + `area.groupId` (optional → Einfach-Modus unverändert).
- Lehrer:innen-Korrektur (`checked readOnly`) zeigt alle Gruppen aufgedeckt +
  gesperrt. Showcase-Seed `0012` mit Gruppen-Hotspot.

---

## Phase A — Reiche Aufgabentypen mit Teilpunkten (A1–A3)

**2026-06-07** · Tags `phase-a1-savepoint` … `phase-a3-savepoint`

### Hintergrund

Bisher waren alle bewertbaren Aufgaben binär (richtig/falsch) und textbasiert.
Die **Lernmodul-Vision 2.0** fügt vier neue Aufgabentypen mit **Teilpunkten**
hinzu (Fundament: Phase P0 — numerische Scores + `PARTIAL_GRADERS`-Map), damit
Schüler:innen für teilweise richtige Lösungen anteilig Punkte bekommen.

### Hinzugefügt

- **`categorize`** (A1) — Items in benannte Behälter einsortieren (Chip-UI).
  Teilpunkte = Anteil korrekt einsortierter Items.
- **`mark_words`** (A4) — Wörter im Fließtext antippen (geteilte `tokenize.ts`).
  Teilpunkte = (Treffer − Fehlklicks) / Anzahl-richtige.
- **`order`** (A2) — Items in die richtige Reihenfolge bringen (Tippen + ▲▼,
  kein Drag). Teilpunkte = Anteil korrekter Nachbarpaare.
- **`hotspot`** (A3) — richtige Stellen im Bild antippen. Sichtbare Kreis-Zonen
  über einem `<img>` (relative 0–1-Koordinaten, responsive). Teilpunkte =
  (Treffer − Fehlklicks) / Anzahl-richtige, Falschklicks ziehen ab.
  - Admin-Editor mit **Klick-aufs-Bild → Zone**, Radius-Slider, „richtig"-Haken.
  - Bildquelle: **Upload** (materials-Bucket) **oder Pexels-Suche**, beide
    admin-geschützt (`lib/db/hotspot-image-actions.ts`, `requireAdmin`).
- Showcase-Modul (`…c5e1ea7`) per Seeds `0008`–`0011` um je eine Aufgabe pro
  neuem Typ erweitert.

### Geändert

- `lib/schemas/blocks.ts`: Live-Block-Schemas (slide/live_poll/quiz_poll/
  word_cloud/scale/understanding) nach `blocks-live.ts` ausgelagert
  (Zeilen-Limit). `allowImportingTsExtensions` in `tsconfig.json` aktiviert,
  damit der Node-Strip-Types-Loader von `validate-module.mjs` den internen
  `.ts`-Import auflöst.
- `BlockView.tsx`: Zuordnungs-/Reihenfolge-/Hotspot-Dispatcher nach
  `block-assignment-renderers.tsx` ausgelagert.

---

## Phase W — Lernmodul-Polish: Hint-Box + Mehrfachversuch

**2026-06-05** · Tag `phase-w-savepoint`

### Hintergrund

Solo-Modul-Durchlauf war heute „1 Versuch, dann weiter". Schüler:in klickt
einmal falsch → sieht „Noch nicht richtig", muss aber stumm weiterklicken,
ohne zu wissen warum oder wie. Phase W fügt zwei didaktische Hebel hinzu:

1. **Mehrere Versuche** pro Frage (1–5, default 1 = altes Verhalten)
2. **Hinweis-Box** mit kollabierbarem Tipp, der nach 1. Fehlversuch erscheint

### Hinzugefügt

- **`components/blocks/HintBox.tsx`** — kollabierbare Tipp-Box mit
  „💡 Hinweis anzeigen"-Toggle. Optionale „noch N Versuche"-Anzeige.
  6 Tests (HintBox.test.tsx).
- **`components/admin/forms/GradedExtensionsFields.tsx`** — Shared-
  Editor-Block für die neuen Felder (Hinweis-Text, Max-Versuche-Select,
  Kategorie-Select „Theorie/Übung/Reflexion"). Eingebaut in alle 4
  bewertbaren Block-Forms (MC/T/F/Lückentext/Match) als kollabierbares
  `<details>`-„Didaktik-Feinheiten".
- **`lib/blocks/points.ts`** — neue Helpers `attemptPenalty(n)` und
  `scoreWithAttempts(base, n)` für die Phase-X-Live-Quiz-Integration
  (−25 % pro weiteren Versuch). 9 Tests.
- **Tests:** `useModuleRunner.test.ts` (6 Tests für Mehrfachversuch-
  State) + co-located HintBox-Tests = 19 neue Tests, 546 gesamt grün.

### Geändert

- **`lib/schemas/blocks.ts`** — neue optionale Felder:
  - `hint?: string` auf MC/T/F/Lückentext/Match (`gradedBlockExtensions`)
  - `maxAttempts?: 1..5` auf den gleichen 4 Typen
  - `category?: 'theorie'|'uebung'|'reflexion'` auf ALLEN Typen
    (`taxonomyExtension`)
  - Konstante `BLOCK_CATEGORIES` exportiert für UI-Selects
  - Bestandsmodule bleiben gültig (alle Felder optional).
- **`components/blocks/useModuleRunner.ts`** — neuer State
  `attemptByBlock`, neue Getter `canRetry`, `attemptCount`, `maxAttempts`,
  neue Action `retry()`. Punkte/Streak werden weiter nur 1× pro Block
  aufgezeichnet (Solo bleibt binär; Multi-Attempt-Penalty wandert in
  Phase X in die Live-Quiz-Punkte).
- **`components/blocks/ModuleRunner.tsx`** — 3-State-Button:
  „Prüfen" → „Nochmal versuchen" (falsch + Versuche übrig + Hinweis-
  Box) → „Weiter". Logik in `ActionButton`-Subkomponente ausgelagert.

### Effekt

Lehrer:in setzt im Editor für eine schwere MC-Frage `maxAttempts=3` und
einen Hinweistext. Schüler:in: klickt falsch → sieht rote Rückmeldung

- gelbe Hinweis-Box (zugeklappt, „noch 2 Versuche") + „Nochmal
  versuchen"-Button. Klickt auf den Hinweis → Tipp wird sichtbar. Probiert
  es nochmal — entweder richtig (weiter) oder beim 3. Versuch verbraucht
  („Weiter" ohne Retry).

### Out of Scope dieser Phase

- BlockList-Gruppierung nach `category` (Daten sind im Schema, UI-
  Gruppierung kommt später)
- Penalty-Berechnung in Live-Quiz-Punkte einfließen lassen (das macht
  Phase X — Pure Helper steht aber bereit)
- `.superRefine()` für fachliche Block-Validierung aus `validate-module.mjs`
  (verschoben — separate Phase, sonst zu großer Atomic-Commit)
- Auto-Save im Modul-Editor mit Debounce (Content-Audit EDIT-HIGH-2 —
  bleibt offen, gehört thematisch eher in Phase X-Refactor)

---

## Phase V — Topics-Foundation aktivieren

**2026-06-05** · Tag `phase-v-savepoint` · Migration `0023`

### Hintergrund

`class_topics` lag seit Migration 0013 als tote Tabelle herum. Stattdessen
hat `assignTopicToClass()` bei jedem „Thema zuweisen" alle published Module
des Themas einzeln in `class_modules` upgesertet — was bedeutete: legt der
Admin ein neues Modul zu einem Topic an, taucht es NICHT automatisch in
zugewiesenen Klassen auf. Lehrer:in muss „neu zuweisen" klicken. (Pre-Launch-
Audit PFAD-CRIT-1.)

Phase V macht `class_topics` zur Source of Truth. Beim Lesen wird über
`class_topics → topics → modules.topic_id` gejoint, sodass neue Module
automatisch erscheinen.

### Hinzugefügt

- **`supabase/migrations/0023_class_topics_activation.sql`** — additiver
  Index `class_topics_topic_idx`. Kein Cleanup, keine Daten-Migration.
- **`lib/db/class-topics-internals.ts`** — pure Helpers + Typen für die
  neue Lese-Logik (ausgelagert für eslint max-lines).
- **`lib/db/student-topics-internals.ts`** — analog für die Schüler:innen-
  Sicht.
- **Tests**: `class-topics.test.ts` (7 Tests), `class-topic-actions.test.ts`
  (6 Tests), `student-topics.test.ts` (5 Tests) — inkl. Kernregression
  „neues Modul erscheint automatisch ohne Re-Assign".

### Geändert

- **`lib/db/class-topics.ts`** — `getAssignedTopicsForClass()` liest jetzt
  `class_topics` als Phase-V-Quelle UND `class_modules` als Override-
  und Legacy-Quelle. Topics aus Bestands-Daten (pre-V `class_modules` ohne
  `class_topics`-Eintrag) bekommen Marker `source: 'modules_legacy'`.
- **`lib/db/class-topic-actions.ts`** — `assignTopicToClass()` upsertet
  ab jetzt in `class_topics` (1 Row pro Zuweisung) statt N Rows in
  `class_modules`. `unassignTopicFromClass()` löscht beide Tabellen
  defensiv (Override-Cleanup + Backward-Compat).
- **`lib/db/student-topics.ts`** — `getAssignedTopicsForStudent()`
  vereinigt beide Quellen mit Dedup-Check pro `moduleId`.

### Effekt

Nach Migration: Lehrer:in weist Topic „EVA" zu → in Schüler:innen-Pfad
erscheinen alle published EVA-Module. Geo legt im Admin ein neues Modul
mit `topic_id = topic-eva` an → ohne weiteres Klicken sichtbar in allen
Klassen mit EVA-Zuweisung.

### Out of Scope dieser Phase

- `class_topics.due_date` bleibt vorerst null (separate Phase für Topic-
  weite Fälligkeiten)
- UI-Anzeige des `source`-Markers (Legacy-Topics werden noch nicht visuell
  als „pre-V" gekennzeichnet)
- Migration alter `class_modules`-Bestand → `class_topics`

---

## Phase U1 — Pre-Launch Security-Blocker

**2026-06-04** · Commit `9ec4626` · `docs/PRE-LAUNCH-AUDIT.md`

### Behoben (Security)

- **CRIT-1: Anonymer DoS auf Live-Sessions** — `/api/live/end` hatte keinen
  Auth-Check. Jeder konnte mit einer geratenen `classId` jede Live-Präsentation
  beenden. Jetzt `requireUser()`-Pflicht + classId-Owner-Check.
- **CRIT-2: PIN-Brute-Force** — `studentLogin` ohne Rate-Limit war in ~14 min
  pro Account knackbar (4 Ziffern × bcrypt cost 10). Jetzt `checkLoginRate`
  (5 Versuche / 15 min pro IP+joinCode+codename-Tupel) + `ipFromHeaderList`
  Helper.
- **CRIT-3: Heartbeat-Spoofing** — `touchQuizPresence` Server-Action war ohne
  Session-Check exportiert (toter Code, aber triggerbar). Gelöscht.
- **HIGH-1: Race in `commitAdvance`** — WHERE-Klausel um `current_question_index`
  ergänzt, verhindert falschen `question_revealed`-Broadcast wenn Lehrer
  manuell weiterschaltet während Auto-Advance läuft.
- **HIGH-4: Rate-Limits** auf `/api/live/{end,results,wordcloud}` ergänzt.

### Audit-Doku

- **`docs/PRE-LAUNCH-AUDIT.md`** mit Befunden aus 5 parallelen Audit-Agents
  (Sicherheit, Performance, Realtime-Code, Doku, Toter Code). Priorisierte
  Fix-Liste: U1=jetzt, U2=vor SEO-Launch, U3=für ≥10 Schulen, T8=Doku-Wrap-up.

---

## Phase T — Hybrid Realtime-Broadcast für Quiz + Live-Präsentation

**2026-06-04** · Commits `b398735` → `dd233cd` → `5d8940d` · ADR-0016 · Tags `pre-phase-t-savepoint`, `phase-t-quiz-savepoint`, `phase-t-live-savepoint`

### Hinzugefügt

- **T0** — ADR-0016 Hybrid-Realtime-Architektur. Spike-Test auf eigener
  Supabase-Instanz: 75-115 ms Latenz gemessen (Ziel war <300 ms).
- **T1** — `lib/realtime/broadcast.ts` (Server-Publish, fire-and-forget),
  `lib/realtime/channels.ts` (zentrale Channel-Namen + Event-Konstanten),
  `components/realtime/useRealtimeWithFallback.ts` (generischer Hybrid-Hook
  mit Polling-Fallback 5s).
- **T2** — Alle 6 Quiz-Server-Actions publishen Broadcasts nach erfolgreichem
  DB-Write: `startQuiz`/`revealQuizQuestion`/`nextQuizQuestion`/`endQuizSession`/
  `submitQuizAnswer`/`joinQuizSession` + `maybeAdvanceQuiz` (race-frei via
  select-after-update).
- **T3** — Quiz-Schüler + Quiz-Beamer-Hooks (`useQuizQuestionPoll`,
  `useQuizBeamerPoll`) als Wrapper über `useRealtimeWithFallback`. Polling-
  Tick von 1s auf 5s reduziert (Last −80%).
- **T4** — `useQuizLobbyPoll` für Lehrer:in auf Realtime; Schüler-Modus bleibt
  klassisches Polling (kein Channel verfügbar bevor Quiz gestartet).
- **T5** — `live-session-actions` (`startPresentation`/`setLiveBlock`/
  `revealResults`/`lockAndReveal`/`setBlockLocked`/`endPresentation`)
  publishen Broadcasts. `useLiveSync` als Wrapper. ClassId kommt vom
  Server-Layout (`app/s/layout.tsx`).
- **T6** — `ProgressMatrixLive`-Wrapper für Lehrer-Fortschrittsmatrix mit
  `router.refresh()`-Pattern. `submitWorksheet` published auf
  `class_progress:{classId}`.

### Behoben

- **Bugfix `dd233cd`**: `self: true` in `useRealtimeWithFallback` damit der
  publizierende Lehrer-Tab seinen eigenen Broadcast erhält + auf eigene
  Aktion reagiert. Vorher asymmetrische Latenz (Schüler sahen Reveal vor
  dem Lehrer-Beamer). Plus „📊 Fortschritt der Klasse"-Link im
  Klassen-Detail-Header.
- **Bugfix `5d8940d`**: `useRealtimeWithFallback` liefert jetzt
  `{state, refetch}`. `QuizTeacherControls.onActionDone` refetcht direkt
  nach jeder Server-Action — spart Realtime-Roundtrip für den schreibenden
  Tab (100-300ms schneller).

### Architektur-Erkenntnis

Realtime-Broadcasts sind ideal für **passive Empfänger** (Schüler-Tabs,
andere Lehrer-Geräte). Für den **schreibenden Tab selbst** ist ein
direkter Refetch nach der Server-Action immer schneller und sauberer
(Broadcast-Loop über Netz ist redundant).

### Verbleibend

- T7 (k6-Lasttest mit echtem Realtime) — offen
- T8 (finale Doku-Updates + `phase-t-realtime-savepoint`-Tag) — teilweise
  abgeschlossen mit Phase U1-Audit

---

## Sprint S + Phase C — Live-Klassen-Quiz + Pre-Launch-Härtung

**2026-06-03** · Commits `9a3fc97` → `30c48cd`, `3aa9d20` → `62fd2e6`

### Hinzugefügt (Sprint S — Live-Quiz)

- **Migration 0020**: `quiz_sessions`, `quiz_participants`, `quiz_answers`
  - RLS-Policies + RPC `start_quiz_session`.
- **S1**: Beamer-Lobby + Schüler:innen-Beitritt + Lobby-Polling.
- **S2**: Live-Frage-Flow (Frage, Antwort, Reveal, Punkte via
  `lib/blocks/points.ts`).
- **S3**: Leaderboard zwischen Fragen + persönlicher Rang
  (`docs/QUIZ-MODI-SPEZIFIKATION.md`).
- **S4**: Quiz-Ende-Podium (Top 3) + Schüler:innen-Zusammenfassung.

### Hinzugefügt (Phase C — Pre-Launch-Härtung)

- **C2**: `/api/health`-Endpoint für Better-Stack-Monitor.
- **C3**: Global-Kill-Switch via Env-Vars (`QUIZ_DISABLED`,
  `LIVE_DISABLED`, `STUDENT_LOGIN_DISABLED`) — `lib/feature-flags.ts`.
- **C4**: Quiz-Tagespensum pro Klasse (Soft-Limit 20/Tag) —
  `lib/db/quiz-quota.ts`.
- **C5**: Öffentliche Status-Page `/status`.
- **C6**: Rate-Limit pro IP für `/api/quiz/*` und `/api/live/*` —
  `lib/rate-limit.ts`.
- **C7**: Cache-Header für statische Endpoints.
- **C8**: k6-Lasttest mit 200 simulierten Schüler:innen
  (`loadtests/quiz-polling.js`).

### Doku

- **`docs/QUIZ-MODI-SPEZIFIKATION.md`** mit allen 13 verbindlichen
  Entscheidungen (Live/Team/Homework, Punkte-Formel, Disconnect-Karenz,
  Anzeigename-Konvention).
- **`docs/SCALE-PLAN.md`** + **`docs/COST-CONTROLS.md`** + **`docs/PRE-LAUNCH-CHECKLIST.md`**.

---

## Sprint R — Solo-Quiz-Polish (vor Live-Quiz)

**2026-06-02** · Commits `b83a95d` → `a1d43b8`

### Hinzugefügt

- **R1.1**: Quiz-Endseite mit Score-Hero + Antwort-Übersicht
  (`components/quiz/SoloRunSummary.tsx`).
- **R1.2**: Punkte-Formel als pure Helper (`lib/blocks/points.ts`).
- **R1.3**: `ModuleRunner` misst Zeit + Streak server-seitig.
- **R1.4**: „Falsche Fragen wiederholen"-Button + wrong-only-Filter.
- **R1.5**: Tippfehlertoleranz für Lückentext (Levenshtein ≤1).

---

## Phase Q — Word-Heft via OneDrive-Sharing-Link

**2026-06-03** · Commits `36512e0` → `2236414` (Branch `feature/thema-workflow`) · ADR-0015

### Hinzugefügt

- **Generelles Word-Schulübungsheft** für O365-SSO-Schüler:innen. EINS pro
  Schüler:in (nicht pro Thema), liegt im eigenen OneDrive. Wird in allen
  Themen-Lernpfaden als zusätzliches Werkzeug angeboten — für Notizen,
  Übungen oder Vorbereitung auf den Abschlusstest.
- **Migration 0018**: Tabelle `word_heft_links (student_code_id, topic_id,
one_drive_url, validation_status, last_validated_at, last_opened_at)`
  mit RLS für Lehrer:innen-Lese-Zugriff auf eigene Klassen.
- **Migration 0019**: Schema-Korrektur — `unique(student_code_id)` als echte
  Constraint (statt partial-Index) damit Upsert/ON-CONFLICT funktioniert.
- **`/s/heft/word`-Route** für Schüler:innen mit `WordHeftSlot`-Component
  (Empty/Existing-Dispatcher).
- **Header-Knopf „📓 Mein Heft"** nur für SSO-Schüler:innen sichtbar
  (`AuthSlotInfo.isSsoStudent`).
- **`WordHeftHint`-Card** auf jeder Themen-Detail-Seite — kompakter
  pädagogischer Hinweis mit „Heft öffnen" oder „Heft einrichten".
- **`WordHeftMatrix`** in `/lehrer/klassen/[id]` — Klassen-Übersicht aller
  Word-Hefte mit Status-Badge + Direkt-Link zu Word-Web.
- **`MagicLinkHint`** in der Lehrer:in-Matrix — wenn die Lehrer:in nur per
  Magic-Link eingeloggt ist, Hinweis dass für Cross-Tenant-Zugriff O365-
  Login nötig ist.
- **`WordHeftInstructionsModal`** mit 7-Schritt-Anleitung (an die echte
  Word-Web-UI angepasst: Teilen → Teilen → ⚙️ neben Link kopieren →
  „Personen in [Schule]" → Übernehmen → Link kopieren → einfügen).
- **`validateOneDriveLink`** Pure Helper (12 Tests): URL-Form-Check gegen
  Microsoft-Domain-Whitelist (`*.sharepoint.com`, `*-my.sharepoint.com`,
  `onedrive.live.com`, `1drv.ms`), Phishing-Schutz, https-Pflicht, max 2000
  Zeichen.
- **Server-Side HEAD-Request-Validierung** (`probeOneDriveUrl`) — ehrliche
  Statuslogik: 404 → broken, Login-Redirect/401/403 → unverified (statt
  fälschlich „broken"), 200 ohne Redirect → ok.
- **Lehrer:innen-Heft-Sicht hat Detail-Reaktion auf SSO-Status** via
  `isAzureLogin(user)` (Identities-Liste-Check).
- **ADR-0015** dokumentiert Begründung: warum kein WOPI (CSPP-Vertrag mit
  Microsoft nötig), warum kein Graph-API (Admin-Consent-Hürde seit Juli
  2025), warum kein eigener Storage (Kosten + AV-Scan + Backup).
- **Datenschutz-Seite + ROLES.md §6b** dokumentieren das neue Modell:
  Datei liegt bei Microsoft im Schul-Tenant, wir speichern nur die URL.

### Geändert

- `app/lehrer/klassen/[id]/page.tsx` refactored: Sub-Komponenten in
  `KlasseDetailSections.tsx` ausgelagert um Datei-Limit einzuhalten.

### STOP-Punkte (User-Aktionen)

- **Migration 0018** im Supabase-Dashboard ausführen
- **Migration 0019** im Supabase-Dashboard ausführen

### Bewusst NICHT enthalten

- Auto-Anlage der Word-Datei via Graph-API (Microsoft-Consent-Hürde)
- Eigener Storage für Word-Dateien (Kosten + AV-Scan + Backup)
- Word inline als iframe (CSPP-Vertrag mit Microsoft nötig)
- Tiptap-Heft wird NICHT ersetzt — bleibt für Code+PIN-Schüler:innen
- Heft pro Thema (urspünglich geplant, vom User auf generelles Heft
  umgewünscht)

---

## Phase O — O365-SSO für Schüler:innen

**2026-06-02** · Commits `36512e0` (O1+O2+O3) + `87e8de3` (Bug-Fixes) + `6f19128` (Folge-Bugs) (Branch `feature/thema-workflow`)

### Hinzugefügt

- **Multi-Tenant Azure-App-Registrierung** + Supabase-Azure-Provider — eine
  App-Registrierung deckt alle NÖ-Schulen ab. Schüler:innen melden sich mit
  ihrem Schul-Microsoft-Konto an.
- **Tinkercad-Pattern für Klassen-Beitritt:** nach OAuth-Callback ohne
  Mitgliedschaft → `/k/join` zeigt Begrüßung + Klassen-Code-Form → Beitritt.
  Folge-Logins führen direkt zu `/s`.
- **Migration 0015** erweitert `student_codes` um `o365_oid`, `o365_email`,
  `given_name`, `surname`, `sso_first_login_at`. `pin_hash` wurde nullable,
  Check-Constraint erzwingt „pin_hash OR o365_oid". Partial Unique Index auf
  `(o365_oid, class_id)` erlaubt Multi-Class-Mitgliedschaft.
- **`/auth/student-callback`-Route** tauscht OAuth-Code, extrahiert Microsoft
  Object ID, verwirft Supabase-Session danach wieder (jose-Cookie bleibt
  alleiniger Session-Träger) und routet je nach Mitgliedschaft.
- **`lib/auth/sso-pending-session.ts`** für temp jose-Cookie (10 Min TTL) das
  die O365-Identität zwischen Callback und Klassen-Code-Eingabe trägt.
- **`/k`-Landing-Page** mit „Mit Microsoft anmelden"-Button als bevorzugtem
  Weg + Code+PIN-Form als Fallback (für Volksschule, Vertretung).
- **`StudentSettingsMenu`** im Header (⚙️-Dropdown): „Klasse verlassen" +
  „Abmelden". Mobile-Menü hat zusätzlich „🚪 Klasse verlassen"-Zeile.
- **`leaveClass`-Server-Action** löscht die eigene `student_codes`-Row,
  Cascade räumt Progress + Hefte + Streak auf.
- **Klassen-Löschen für Lehrer:innen** mit Bestätigungs-Dialog (exakter
  Klassenname als Eingabe-Schutz). Cascade-FKs räumen alles auf.
- **Beamer-Code-Screen** `/lehrer/klassen/[id]/beamer` — eigene Route ohne
  Header, riesiger Klassen-Code, Login-URL für Schüler:innen-Geräte. Prominent
  verlinkt von der Klassen-Detail-Seite.
- **`studentDisplayName`-Helper** mit Fallback-Kette: Vorname Nachname →
  Email-Lokalteil → Codename → „Schüler:in". Kapselt die Anzeige-Logik für
  Header, Codes-Liste, Dashboard.
- **Klassenname im Schüler-Dashboard** über `getClassNameForStudent`-Helper
  (Service-Role-Client, weil Schüler:innen kein `auth.uid()` haben).
- **ADR-0014** dokumentiert die Architektur-Entscheidung (multi-tenant,
  jose-Cookie als Single-Source-of-Truth, Tinkercad-Pattern).

### Geändert

- **`student_codes`-Schema** erweitert um O365-Felder (Phase O1).
- **`StudentCodeRow`** zeigt Anzeigenamen statt Codename für SSO-User,
  Microsoft-Badge statt PIN-Button.
- **HeaderAuth** Schüler:in-Variante: Settings-Dropdown statt nur Label+Abmelden.

### Behoben

- **Hydration-Mismatch im Beamer-Code-Screen** (`window.location.origin` im
  SSR vs. Client) — gelöst mit `useSyncExternalStore`.
- **Codename `"."` bei leeren Namens-Feldern** — Callback nutzt jetzt
  `name`-Fallback + Email-Lokalteil-Ableitung. Migration 0016 repariert
  Bestand.

### Phase O4 — Datenschutz-Update + optionale Domain-Allowlist

- **Migration 0017** ergänzt `classes.allowed_email_domains text[]`. Optionale
  Whitelist von E-Mail-Domains für den O365-Beitritt. NULL/leer = alle erlaubt.
- **`isEmailDomainAllowed`-Helper** (pure, getestet) prüft die Domain vor dem
  Insert in `joinClassWithO365`. Neuer `domain_not_allowed`-Fehler-Discriminator
  im `JoinClassResult`.
- **Datenschutz-Seite** (`app/datenschutz/page.tsx`) erweitert:
  - Schüler:innen-Bereich hat jetzt zwei Sub-Abschnitte (Code+PIN pseudonym
    vs. O365-SSO mit Vorname/Nachname/Email).
  - Microsoft Ireland als zusätzlicher Auftragsverarbeiter dokumentiert
    (mit Standardvertragsklauseln nach Art. 46 DSGVO).
  - Pexels als Auftragsverarbeiter ergänzt (war seit Schulheft-Phase fällig).
  - Cookie-Sektion erwähnt den temporären `sso_pending`-Cookie (10 Min TTL).
  - Retention-Block erwähnt das selbstständige Klassen-Verlassen.
- **`docs/ROLES.md`** hat neuen §6a, der die zwei Schüler:innen-Identitäts-Pfade
  beschreibt (Code+PIN vs. O365-SSO) und auf ADR-0014 verweist.

### STOP-Punkte (User-Aktionen)

- **Migration 0015** im Supabase-Dashboard ausführen
- **Migration 0016** im Supabase-Dashboard ausführen (repariert defekte SSO-Rows)
- **Migration 0017** im Supabase-Dashboard ausführen (optionale Domain-Allowlist)
- **Azure-App-Registrierung** + Supabase-Azure-Provider aktivieren (Phase O0)

### Nicht enthalten

- Lehrer:innen-SSO via O365 (Phase O5, später — Magic-Link reicht heute)
- Domain-Whitelist pro Klasse (Phase O4, optional)
- Microsoft-Education-API-Roster-Sync (Vision, später wenn echter Bedarf)
- QR-Code auf Beamer-Screen (würde neue Dependency erfordern)

---

## Phase E — Drei Aktivitäten sauber trennen

**2026-05-31** · Commits `8e07368` + (E2/E3 dieser Commit, folgt) (Branch
`feature/thema-workflow`) · Savepoint `phase-d-savepoint`

### Hinzugefügt

- **Drei first-class Aktivitäten** im UI: Arbeitsblatt · Lernmodul · Präsentation.
  Vorher hieß alles „Modul" und unterschied sich nur durch `display_mode`.
- **`lib/activities.ts`** als Single Source of Truth für Labels, URLs,
  Beschreibungen und welche Block-Typen pro Aktivität erlaubt sind.
- **Drei getrennte Admin-Routen** mit eigenen Listen + Erstellen + Editieren:
  `/admin/lernmodule`, `/admin/praesentationen`, `/admin/arbeitsblaetter`
  (letztere redirected aktuell zu `/admin/material`, Daten-Tabelle bleibt).
- **Admin-Dashboard** mit drei großen Aktivitäts-Karten statt einer Liste.
- **`AddBlockDialog` filtert pro Aktivität**: Lernmodul zeigt Theorie (ohne Slide)
  - Worksheet-Aufgaben, Präsentation zeigt Theorie (mit Slide) + Live-Blöcke.
- **Lehrer-Sicht** zeigt zugewiesene Aktivitäten nach Aktivitäts-Typ gruppiert
  (Lernmodule + Präsentationen als getrennte Sektionen mit passenden Aktions-Verben).

### Geändert

- Migration 0012: neue Spalte `modules.activity_kind`
  (`'lernmodul' | 'praesentation'`), Bestand gemappt:
  alle `presentation`-Module → `praesentation`, Rest → `lernmodul`.
- `display_mode` bleibt als Sub-Variante FÜR Lernmodule (`'quiz' | 'worksheet'`).
- Wording-Pass: Admin-Nav, Dashboard, Editor-Titel, Schüler-Dashboard
  („Deine Module" → „Deine Lernmodule").

### Behoben

- Latenter Schüler-Dispatcher-Bug: Präsentationen würden vor Phase E
  stillschweigend in den Quiz-Runner fallen wenn jemand die ID öffnet —
  jetzt filtert `getStudentModule` + `getAssignedModules` auf
  `activity_kind='lernmodul'`.
- Beamer-Route prüft jetzt `activityKind` (primärer Diskriminator) statt
  des fragilen `displayMode === 'presentation'`.

### Nicht geändert

- Block-Schema, Block-Renderer, Block-Engine — geteiltes Fundament.
- `materials`-Tabelle für Arbeitsblätter — Daten + Edit-UI bleiben wie heute.
- Alte URLs (`/admin/module/*`, `/admin/material/*`) — redirecten weiterhin
  auf die neuen Routen (Bookmark-Schutz).

---

## Phase 16 — Abgaben einsehen + Feedback/Rückgabe + Auto-Bewertung

**2026-05-30** · Commits `43b3814`, `d74bf01`, `0088190` (Branch
`phase-16-feedback-grading`)

### Hinzugefügt

- **Abgabe-Detailansicht für Lehrer:innen**
  (`/lehrer/klassen/[id]/fortschritt/[studentCodeId]/[moduleId]`): komplettes
  Modul read-only mit eingetragenen Antworten + grün/rot bei auto-bewertbaren
  Aufgaben + Score-Header. Datenschicht `lib/db/teacher-submission.ts`, UI
  `TeacherSubmissionBlocks` / `BlockResultBadge` / `SubmissionScoreHeader` /
  `SubmissionReview`.
- **Feedback + Rückgabe-Zyklus**: Lehrer:in schreibt Feedback + gibt „zur
  Überarbeitung zurück" → entsperrt das Modul (Status `returned`). Schüler:in
  sieht Feedback-Banner, überarbeitet, gibt neu ab (Score wird neu berechnet).
  Server-Actions `lib/db/teacher-feedback-actions.ts` (User-Client + RLS).
- **Auto-Bewertung mit Schwelle**: Worksheet-Score serverseitig
  (`submitWorksheet` → `computeScore`); Bestehens-Schwelle **pro Zuweisung**
  (`class_modules.pass_threshold`). Matrix färbt bestanden/nicht-bestanden.
  Teilpunkt-fähiges `gradeBlock` (0.0–1.0) in `lib/blocks/evaluate.ts`.
- **`docs/MODUL-SPEZIFIKATION.md`** + **`scripts/validate-module.mjs`**
  (`pnpm validate:module`) — verbindliche Block-JSON-Spec + maschinelle
  Validierung gegen das echte Schema vor dem Import.

### Geändert

- `student_progress` um `teacher_feedback`, `returned_at`, `manual_marks`;
  `class_modules` um `pass_threshold` (Migration 0007 + RLS-UPDATE-Policy
  `student_progress_update_own_classes`).
- `ModuleStatus` von 3 auf 4 Stufen (`returned`).

### Fixed

- Lehrer:innen-Abgabe-Detailseite lief über die volle Viewport-Breite — jetzt
  `mx-auto max-w-3xl` (konsistent mit übrigen Lehrer:innen-Seiten).
- Matrix-Zell-Tooltip ergänzt „N/M richtig".

### Tests

- 231 grün (+18): `evaluate` (percentScore/isPassed/blockResult/gradeBlock),
  `student-modules-status` (`returned`), `class-progress` (passed/returned).

### Docs

- ADR-0011 (Schwelle pro Zuweisung) + ADR-0012 (Feedback/Rückgabe, keine KI).

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

- 213 grün (+51): u. a. `class-modules` (6), `class-progress` (6 für pure
  Helper), `ClassProgressCell` (5), `ModuleAssignmentPanel` (5 incl.
  Filter-Logik) + weitere.

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
