# Modul-Spezifikation — das verbindliche Block-Format

> **Zweck dieser Datei.** Sie ist die **eine, kanonische Wahrheit** dafür, wie ein
> Modul-JSON aufgebaut ist: welche Block-Typen es gibt, welche Felder jeder
> braucht, **wo die Lösung steht** und **wie die automatische Bewertung rechnet**.
> Wenn eine KI (oder ein Mensch) ein neues Modul baut, soll diese Datei reichen,
> um es **bewertbar und anzeigbar** zu machen — ohne den Quellcode zu lesen.
>
> **Single Source of Truth bleibt der Code.** Diese Datei beschreibt, was
> `lib/schemas/blocks.ts` (Struktur) und `lib/blocks/evaluate.ts` (Bewertung)
> tun. Bei Widerspruch gewinnt der Code — dann ist **diese Datei** zu
> korrigieren. Validiere jedes Modul vor dem Import mit:
>
> ```bash
> pnpm validate:module pfad/zu/modul.json
> ```
>
> Stand: 2026-05-30.

## 1. Das große Ganze in drei Sätzen

Ein Modul ist ein JSON-Objekt `{ "blocks": [ … ] }`. Jeder Block hat eine
**eindeutige `id`** und einen **`type`**; der Typ bestimmt die übrigen Felder
(diskriminierte Union). 17 Block-Typen total — verteilt auf **drei Gruppen**:
Theorie/Folie (nicht bewertet), Worksheet-Aufgaben (8 davon auto-bewertbar),
und Live-Interaktionen (auf Schüler:innen-Geräten während einer Präsentation,
nicht bewertet — Stimmen leben in `live_votes`, nicht in `student_progress`).

### Begriffsklärung „Modul" (Phase E)

„Modul" ist DB-/Code-Sprache (`modules`-Tabelle). Im UI sieht der User aber
**zwei** verschiedene Dinge die beide aus dieser Tabelle stammen:

| User-Wort        | DB                                      | Wo erstellt                  |
| ---------------- | --------------------------------------- | ---------------------------- |
| **Lernmodul**    | `modules.activity_kind='lernmodul'`     | `/admin/lernmodule/neu`      |
| **Präsentation** | `modules.activity_kind='praesentation'` | `/admin/praesentationen/neu` |

Plus die dritte Aktivität **Arbeitsblatt** (PDF-Upload), die in der
`materials`-Tabelle lebt — komplett anderes Datenmodell, nicht Teil dieser
Spezifikation hier.

Diese Spezifikation beschreibt das Block-JSON-Format, das für BEIDE
Aktivitäts-Typen (Lernmodul + Präsentation) gleich ist. Was sich pro
Aktivität unterscheidet: welche Block-Typen erlaubt sind — Filter in
`lib/activities.ts` (`isBlockAllowedFor`).

## 2. Block-Typen auf einen Blick

**Gruppe A — Theorie/Folie** (statische Anzeige, kein Eingabefeld, nicht bewertet):

| `type`    | Zweck                       | Modus                                 |
| --------- | --------------------------- | ------------------------------------- |
| `text`    | Erklärtext, optional Bild   | Worksheet + Presentation              |
| `infobox` | „Merke"-Kasten              | Worksheet + Presentation              |
| `slide`   | Präsentationsfolie (Beamer) | **Nur** `display_mode='presentation'` |

**Gruppe B — Worksheet-Aufgaben** (Eingabefelder, automatisch bewertet außer `reflection`):

| `type`            | Zweck                             | Auto-bewertbar?    | Wo die Lösung steht                          |
| ----------------- | --------------------------------- | ------------------ | -------------------------------------------- |
| `multiple_choice` | Mehrfachauswahl                   | ✅ ja              | `options[].correct: true`                    |
| `true_false`      | Wahr/Falsch                       | ✅ ja              | `answer: true \| false`                      |
| `fill_blank`      | Lückentext                        | ✅ ja              | `solutions[]` (Reihenfolge der `{0}`,`{1}`…) |
| `match`           | Zuordnung Begriff→Kategorie       | ✅ ja              | `pairs[].category`                           |
| `categorize`      | Items in Behälter einsortieren    | ✅ ja (Teilpunkte) | `items[].bucketId`                           |
| `mark_words`      | Wörter im Text markieren          | ✅ ja (Teilpunkte) | `correctIndices[]` (wordIndex)               |
| `order`           | Items in Reihenfolge bringen      | ✅ ja (Teilpunkte) | `items[]` in korrekter Reihenfolge           |
| `hotspot`         | Richtige Stellen im Bild antippen | ✅ ja (Teilpunkte) | `areas[].isCorrect`                          |
| `reflection`      | Freie offene Antwort              | ❌ nein            | — (manuell von Lehrer:in beurteilt)          |

**Gruppe C — Live-Interaktionen** (nur `display_mode='presentation'`, Stimmen in `live_votes`, **nicht bewertet** — zählen nicht zu `max_score`):

| `type`          | Zweck                              | Eingabe am Schüler-Gerät  | Stimmen-Speicher              |
| --------------- | ---------------------------------- | ------------------------- | ----------------------------- |
| `live_poll`     | Unbenotetes Meinungsbild           | Buttons mit Optionen      | `live_votes.option_id`        |
| `quiz_poll`     | Quiz mit richtiger Antwort         | Buttons mit Optionen      | `live_votes.option_id`        |
| `word_cloud`    | Freitext-Wortwolke                 | Textfeld (max 40 Zeichen) | `live_votes.free_text`        |
| `scale`         | Skala 1–N (z. B. Selbsteinschätz.) | Buttons mit Zahlen        | `live_votes.option_id` ('1'…) |
| `understanding` | Verständnis-Ampel (rot/gelb/grün)  | 3 feste Ampel-Buttons     | `live_votes.option_id`        |

> **Merksatz für die Bewertung:** `max_score` = **Anzahl der auto-bewertbaren
> Blöcke** (jeder zählt 1 Punkt). `score` = Summe der korrekt gelösten. Hat ein
> Modul **null** bewertbare Blöcke, ist `max_score = 0` und eine Prozent-Note
> ist **nicht anwendbar** (Anzeige neutral, nie „0 %").

## 3. Felder pro Block-Typ

Allgemein gilt für **jeden** Block: `id` (nicht-leerer String, **eindeutig** im
Modul) und `type` (einer der 17 Werte aus der Tabelle in §2).

### 3.1 `text` — Erklärtext (nicht bewertet)

| Feld       | Typ    | Pflicht  | Hinweis                            |
| ---------- | ------ | -------- | ---------------------------------- |
| `content`  | string | ✅       | Der Fließtext (Du-Form, kurz).     |
| `imageUrl` | string | optional | Gültige URL, falls Bild gewünscht. |

```json
{ "id": "b1", "type": "text", "content": "Eine Suchmaschine durchsucht das Internet für dich." }
```

### 3.2 `infobox` — „Merke"-Kasten (nicht bewertet)

| Feld      | Typ    | Pflicht  | Hinweis              |
| --------- | ------ | -------- | -------------------- |
| `title`   | string | optional | z. B. „Merke".       |
| `content` | string | ✅       | Prägnanter Merksatz. |

```json
{ "id": "b2", "type": "infobox", "title": "Merke", "content": "Werbung steht oft ganz oben." }
```

### 3.3 `multiple_choice` — Mehrfachauswahl (bewertet)

| Feld              | Typ      | Pflicht  | Hinweis                                          |
| ----------------- | -------- | -------- | ------------------------------------------------ |
| `question`        | string   | ✅       | Die Frage.                                       |
| `options`         | Option[] | ✅       | **Mindestens 2**. Jede: `{ id, text, correct }`. |
| `feedbackCorrect` | string   | optional | Wird bei richtiger Lösung gezeigt.               |
| `feedbackWrong`   | string   | optional | Wird bei falscher Lösung gezeigt.                |

- **Option:** `id` (nicht-leer, **eindeutig** im Block), `text` (string),
  `correct` (boolean).
- **Lösung:** alle Optionen mit `correct: true`. **Mindestens eine** ist Pflicht.
  Mehrere `correct: true` ⇒ es müssen **genau alle** angekreuzt werden (kein mehr,
  kein weniger), sonst 0 Punkte.

```json
{
  "id": "b3",
  "type": "multiple_choice",
  "question": "Was ist ein Hinweis auf Werbung?",
  "options": [
    { "id": "o1", "text": "Das Wort „Anzeige“", "correct": true },
    { "id": "o2", "text": "Eine .at-Adresse", "correct": false },
    { "id": "o3", "text": "Viele Bilder", "correct": false },
    { "id": "o4", "text": "Ein Datum", "correct": false }
  ],
  "feedbackCorrect": "Genau — „Anzeige“ markiert bezahlte Treffer.",
  "feedbackWrong": "Achte auf das Wort „Anzeige“ über dem Treffer."
}
```

### 3.4 `true_false` — Wahr/Falsch (bewertet)

| Feld              | Typ     | Pflicht  | Hinweis                          |
| ----------------- | ------- | -------- | -------------------------------- |
| `question`        | string  | ✅       | Die Aussage.                     |
| `answer`          | boolean | ✅       | `true` = wahr, `false` = falsch. |
| `feedbackCorrect` | string  | optional |                                  |
| `feedbackWrong`   | string  | optional |                                  |

- **Lösung:** das Feld `answer`. Korrekt, wenn die Schüler:in-Antwort exakt
  `answer` entspricht.

```json
{
  "id": "b4",
  "type": "true_false",
  "question": "Suchmaschinen zeigen immer zuerst die beste Quelle.",
  "answer": false,
  "feedbackWrong": "Oben steht oft Werbung, nicht die beste Quelle."
}
```

### 3.5 `fill_blank` — Lückentext (bewertet)

| Feld          | Typ      | Pflicht  | Hinweis                                                         |
| ------------- | -------- | -------- | --------------------------------------------------------------- |
| `text`        | string   | ✅       | Enthält Platzhalter `{0}`, `{1}`, … (bei 0 beginnend).          |
| `solutions`   | string[] | ✅       | **Mindestens 1.** Lösungswörter **in Platzhalter-Reihenfolge**. |
| `distractors` | string[] | optional | Zusätzliche Ablenkungswörter für den Wortpool. Default `[]`.    |

- **Kritische Regel:** Die **Anzahl** der `solutions` muss **exakt** zum höchsten
  Platzhalter-Index + 1 passen. `{0}` und `{1}` im Text ⇒ genau **2** `solutions`.
  Stimmt das nicht, schlägt `pnpm validate:module` fehl (und die Anzeige bricht).
- **Lösung:** `solutions[i]` gehört in Platzhalter `{i}`. Vergleich ist
  **getrimmt + case-insensitiv** (`"Index"` == `" index "`). Alle Lücken müssen
  stimmen, sonst 0 Punkte.

```json
{
  "id": "b5",
  "type": "fill_blank",
  "text": "Ein {0} durchsucht Seiten, der {1} speichert sie.",
  "solutions": ["Crawler", "Index"],
  "distractors": ["Browser", "Server"]
}
```

### 3.6 `match` — Zuordnung (bewertet)

| Feld       | Typ    | Pflicht  | Hinweis                                            |
| ---------- | ------ | -------- | -------------------------------------------------- |
| `question` | string | optional | Aufgabenstellung.                                  |
| `pairs`    | Pair[] | ✅       | **Mindestens 2.** Jedes: `{ id, term, category }`. |

- **Pair:** `id` (nicht-leer, **eindeutig** im Block), `term` (der zuzuordnende
  Begriff), `category` (die richtige Kategorie für diesen Begriff).
- **Regel:** Es müssen **mindestens 2 unterschiedliche** `category`-Werte
  vorkommen (sonst gibt es nichts zuzuordnen → Validierungsfehler).
- **Lösung:** Begriff `term` gehört in seine `category`. Alle Paare müssen
  korrekt zugeordnet sein, sonst 0 Punkte.

```json
{
  "id": "b6",
  "type": "match",
  "question": "Ordne zu.",
  "pairs": [
    { "id": "p1", "term": "Crawler", "category": "Technik" },
    { "id": "p2", "term": "Index", "category": "Technik" },
    { "id": "p3", "term": "Werbung", "category": "Vorsicht" },
    { "id": "p4", "term": "Quelle prüfen", "category": "Vorsicht" }
  ]
}
```

### 3.7 `reflection` — Freie Antwort (nicht auto-bewertet)

| Feld          | Typ    | Pflicht  | Hinweis                                 |
| ------------- | ------ | -------- | --------------------------------------- |
| `prompt`      | string | ✅       | Die offene Frage.                       |
| `placeholder` | string | optional | Beispielhafter Platzhaltertext im Feld. |

- **Keine automatische Bewertung.** Freitext wird **manuell** von der Lehrer:in
  beurteilt (Häkchen in der Abgabe-Detailansicht, `manual_marks`). Zählt **nicht**
  zu `max_score`. Es gibt bewusst **keine KI-Bewertung** (DSGVO, lokal/EU-only —
  siehe ADR-0012).

```json
{
  "id": "b7",
  "type": "reflection",
  "prompt": "Wozu nutzt du Suchmaschinen?",
  "placeholder": "z. B. für Hausübungen …"
}
```

### 3.8 `slide` — Präsentationsfolie (nicht bewertet, Presentation-Modus)

Großformatige Folie am Beamer. **Nur** in Modulen mit `display_mode='presentation'`
sinnvoll — im Worksheet-Modus wirkt sie sperrig.

| Feld       | Typ    | Pflicht  | Hinweis                                     |
| ---------- | ------ | -------- | ------------------------------------------- |
| `title`    | string | ✅       | Großer Titel (eine Zeile).                  |
| `body`     | string | optional | Erläuternder Text unter dem Titel.          |
| `imageUrl` | string | optional | Gültige URL eines Bildes (max. ca. 800 px). |

```json
{
  "id": "s1",
  "type": "slide",
  "title": "Was passiert beim Speichern?",
  "body": "Wenn du Strg+S drückst, wird die Datei auf die Festplatte geschrieben."
}
```

### 3.9 `live_poll` — Live-Abstimmung (nicht bewertet, Presentation-Modus)

Unbenoteter Meinungsbild-Block. Schüler:innen sehen Optionen auf ihrem Gerät,
am Beamer erscheinen die Stimmen als Balken (erst nach „Ergebnis zeigen").

| Feld       | Typ      | Pflicht | Hinweis                                 |
| ---------- | -------- | ------- | --------------------------------------- |
| `question` | string   | ✅      | Die Frage am Beamer.                    |
| `options`  | Option[] | ✅      | **Mindestens 2**. Jede: `{ id, text }`. |

- **Option:** `id` (nicht-leer, **eindeutig** im Block), `text` (string).
- **Kein `correct`-Feld** — `live_poll` ist ein Meinungsbild. Wenn du eine
  richtige Antwort willst, nimm `quiz_poll`.

```json
{
  "id": "p1",
  "type": "live_poll",
  "question": "Wie fühlst du dich nach der Pause?",
  "options": [
    { "id": "o1", "text": "Wach" },
    { "id": "o2", "text": "Geht so" },
    { "id": "o3", "text": "Müde" }
  ]
}
```

### 3.10 `quiz_poll` — Quiz-Live-Abstimmung mit richtiger Antwort (nicht bewertet, Presentation-Modus)

Wie `live_poll`, aber mit **richtiger Antwort**. Schüler:innen sehen die Antwort
**nicht** vorab (das `correct`-Flag wird serverseitig entfernt, bevor es ans
Gerät geht). Erst beim Klick auf „Auflösen" markiert der Beamer die richtige(n)
Option(en) grün.

| Feld       | Typ      | Pflicht | Hinweis                                          |
| ---------- | -------- | ------- | ------------------------------------------------ |
| `question` | string   | ✅      | Die Frage am Beamer.                             |
| `options`  | Option[] | ✅      | **Mindestens 2**. Jede: `{ id, text, correct }`. |

- **Option:** `id`, `text`, `correct` (boolean). Mindestens eine `correct: true`.
- **Sicherheit:** Das `correct`-Flag wird **niemals** an Schüler:innen-Geräte
  gesendet. Im Network-Tab eines Kind-Browsers tauchen die Optionen ohne
  `correct` auf.

```json
{
  "id": "q1",
  "type": "quiz_poll",
  "question": "Welches ist ein Eingabegerät?",
  "options": [
    { "id": "a", "text": "Drucker", "correct": false },
    { "id": "b", "text": "Maus", "correct": true },
    { "id": "c", "text": "Lautsprecher", "correct": false },
    { "id": "d", "text": "Bildschirm", "correct": false }
  ]
}
```

### 3.11 `word_cloud` — Freitext-Wortwolke (nicht bewertet, Presentation-Modus)

Schüler:innen tippen ein Wort oder einen kurzen Satz (max 40 Zeichen). Am Beamer
erscheinen die Beiträge als Wortwolke — häufige Wörter werden größer
dargestellt (lowercase + getrimmter Vergleich für Duplikat-Zählung).

| Feld       | Typ    | Pflicht | Hinweis                                           |
| ---------- | ------ | ------- | ------------------------------------------------- |
| `question` | string | ✅      | Der Prompt am Beamer („Was fällt dir ein zu …?"). |

```json
{
  "id": "w1",
  "type": "word_cloud",
  "question": "Was fällt dir zum Wort „Internet" ein?"
}
```

### 3.12 `scale` — Skala 1–N (nicht bewertet, Presentation-Modus)

Schüler:innen klicken einen Wert auf einer Skala (Default 1–5). Am Beamer werden
Durchschnitt und Verteilung als Balkendiagramm angezeigt. Gut für
Selbsteinschätzung oder Stimmungsbilder mit Abstufung.

| Feld       | Typ    | Pflicht  | Hinweis                                          |
| ---------- | ------ | -------- | ------------------------------------------------ |
| `question` | string | ✅       | Die Frage am Beamer.                             |
| `min`      | number | optional | Untere Grenze, Default `1`.                      |
| `max`      | number | optional | Obere Grenze, Default `5`. Üblich: 3–7 Schritte. |
| `minLabel` | string | optional | Beschriftung unter dem `min`-Wert.               |
| `maxLabel` | string | optional | Beschriftung unter dem `max`-Wert.               |

```json
{
  "id": "sc1",
  "type": "scale",
  "question": "Wie sicher fühlst du dich mit der Tastatur?",
  "min": 1,
  "max": 5,
  "minLabel": "gar nicht",
  "maxLabel": "sehr sicher"
}
```

### 3.13 `understanding` — Verständnis-Ampel (nicht bewertet, Presentation-Modus)

Schnelles Drei-Tasten-Signal: 🟢 verstanden / 🟡 unsicher / 🔴 noch nicht. Keine
freien Optionen — die drei Werte sind im Code fest verdrahtet, der Beamer zeigt
sie als drei Ampel-Balken mit Prozenten.

| Feld       | Typ    | Pflicht  | Hinweis                                                              |
| ---------- | ------ | -------- | -------------------------------------------------------------------- |
| `question` | string | optional | Default: „Wie gut hast du das verstanden?". Kann übersteuert werden. |

```json
{
  "id": "u1",
  "type": "understanding",
  "question": "Hast du das EVA-Prinzip verstanden?"
}
```

## 4. Wie die automatische Bewertung rechnet

Die gesamte Logik lebt in **`lib/blocks/evaluate.ts`** (und ist unit-getestet).
Sie ist **typ-agnostisch**: jede Auswertung läuft über `gradeBlock()` +
`isGraded()`, nie über eine fest verdrahtete Typ-Liste außerhalb dieser Datei.

> **Live-Blöcke fließen nicht in die Bewertung ein.** `live_poll`, `quiz_poll`,
> `word_cloud`, `scale`, `understanding` und `slide` sind in `NON_GRADED` —
> sie zählen nicht zu `max_score`, ihre Stimmen leben in `live_votes`
> (nicht in `student_progress.answers`), und sie tauchen weder in der
> Lehrer:innen-Fortschritts-Matrix noch in der Prozent-Note auf. Das ist
> bewusst: Live-Interaktion ist Klassen-Stimmungsbild, keine Leistungsmessung.
> Für eine bewertbare Quiz-Frage nimm `multiple_choice` oder `true_false` im
> Worksheet-Modus.

| Funktion                          | Was sie liefert                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `isGraded(block)`                 | `true` für die bewertbaren Worksheet-Typen, `false` für alle anderen.                                                                          |
| `gradeBlock(block, answer)`       | **Teilergebnis 0.0–1.0**. `categorize`/`mark_words`/`order`/`hotspot` liefern echte Teilpunkte (via `PARTIAL_GRADERS`), die übrigen binär 0/1. |
| `scoreModule(blocks, answers)`    | Summe der `gradeBlock`-Werte über alle bewertbaren Blöcke = `score`.                                                                           |
| `maxScore(blocks)`                | Anzahl bewertbarer Blöcke = `max_score`.                                                                                                       |
| `percentScore(score, max)`        | Gerundete Prozent, **oder `null`** wenn `max <= 0`.                                                                                            |
| `isPassed(score, max, threshold)` | `true`/`false`, **oder `null`** wenn keine Schwelle ODER `max = 0`.                                                                            |
| `blockResult(block, answer)`      | `'correct' \| 'wrong' \| 'ungraded'` (für die Detailansicht).                                                                                  |

**Bestehens-Schwelle** (`pass_threshold`) lebt **pro Klassen-Zuweisung**, nicht
pro Modul (siehe ADR-0011). Ein Modul mit `max_score = 0` kann nie „bestanden"
oder „nicht bestanden" sein — die Anzeige bleibt neutral.

### Antwort-Formate (was der Renderer pro Block speichert)

Wichtig, falls du Seed-Daten oder Tests von Hand schreibst. Die Antworten liegen
als `Record<blockId, answer>` in `student_progress.answers`:

| Block-Typ         | Antwort-Format                  | Beispiel                                  |
| ----------------- | ------------------------------- | ----------------------------------------- |
| `multiple_choice` | `string[]` (Option-IDs)         | `["o1"]` bzw. `["o1","o3"]`               |
| `true_false`      | `boolean`                       | `false`                                   |
| `fill_blank`      | `(string\|null)[]`              | `["Crawler","Index"]` (Reihenfolge `{i}`) |
| `match`           | `Record<pairId,cat>`            | `{ "p1":"Technik", "p3":"Vorsicht" }`     |
| `categorize`      | `Record<itemId,bucketId>`       | `{ "ci1":"b-ein", "ci4":"b-aus" }`        |
| `mark_words`      | `number[]` (wordIndex)          | `[2, 5, 22]`                              |
| `order`           | `string[]` (itemId-Reihenfolge) | `["oe1","oe2","oe3"]`                     |
| `hotspot`         | `string[]` (areaId)             | `["hs-tastatur","hs-maus"]`               |
| `reflection`      | `string`                        | `"Ich nutze sie für …"`                   |

## 5. Pflicht-Checkliste vor dem Import

**Allgemein:**

- [ ] Top-Level ist `{ "blocks": [ … ] }` (das Array allein geht auch durch das
      Validierungs-Script, der Editor erwartet aber das Objekt).
- [ ] Jede Block-`id` ist **eindeutig**.
- [ ] `pnpm validate:module modul.json` läuft **grün**.

**Worksheet-Module** (`display_mode='worksheet'`, Standard):

- [ ] Jeder `multiple_choice` hat **≥ 1** Option mit `correct: true`; Options-`id`s eindeutig.
- [ ] Jeder `fill_blank`: **Anzahl `solutions` == höchster `{n}`-Index + 1**.
- [ ] Jeder `match`: **≥ 2 unterschiedliche** `category`-Werte; `pair`-`id`s eindeutig.
- [ ] Mindestens **ein** auto-bewertbarer Block, falls eine Prozent-Note erwünscht ist.
- [ ] **Keine** Live-Blöcke (`live_poll`, `quiz_poll`, `word_cloud`, `scale`,
      `understanding`, `slide`) — die brauchen `display_mode='presentation'`.

**Presentation-Module** (`display_mode='presentation'`, geführter Beamer-Verlauf):

- [ ] Jeder `live_poll` / `quiz_poll`: **≥ 2** Optionen, Options-`id`s eindeutig.
- [ ] Jeder `quiz_poll`: **≥ 1** Option mit `correct: true` (sonst leuchtet beim
      Auflösen nichts grün).
- [ ] Jeder `scale`: wenn `min`/`max` gesetzt, dann `max > min` und Spanne ≤ 10
      (sonst werden die Buttons zu klein für Handys).
- [ ] Reihenfolge folgt einer didaktischen Dramaturgie (siehe
      `docs/AUTOR-WORKFLOW.md` §9: Einstieg → Theorie-Folien → Aktivierung →
      Sicherung → Reflexion).
- [ ] **Keine** Worksheet-Aufgaben (`multiple_choice`, `true_false`, `fill_blank`,
      `match`) — die haben keine Beamer-Renderer und würden im Presentation-Modus
      stumm bleiben. Für Quizfragen im Live-Modus: `quiz_poll`.

## 6. Einen NEUEN Block-Typ einführen (für Entwickler:innen)

Der Pfad ist bewusst auf **genau drei Stellen** beschränkt — der Rest der
Pipeline (Scoring, Prozent, Bestehen, Lehrer:innen-Matrix) läuft danach
**ohne Änderung** weiter:

1. **`lib/schemas/blocks.ts`** — neues Zod-Schema definieren und in die
   `blockSchema`-Union aufnehmen (+ Antwort-Format dokumentieren).
2. **`lib/blocks/evaluate.ts`** — falls auto-bewertbar: einen Eintrag in
   `CHECKERS` ergänzen (Korrektheits-Prüfung). Für **Teilpunkte** den Eintrag
   einen Bruchwert 0.0–1.0 zurückgeben lassen — `gradeBlock` reicht ihn durch,
   alles Übrige bleibt unverändert.
3. **`components/blocks/`** — Renderer (Anzeige + Eingabe) bauen und in
   `BlockView.tsx` einhängen.

Danach: **diese Datei** (§2/§3/§4-Tabellen) und das Prompt-Template in
`docs/AUTOR-WORKFLOW.md` §4 nachziehen, einen Test in `evaluate.test.ts`
ergänzen, fertig.

## 7. Querverweise

- [`lib/schemas/blocks.ts`](../lib/schemas/blocks.ts) — Zod-Schema (Struktur-Wahrheit)
- [`lib/blocks/evaluate.ts`](../lib/blocks/evaluate.ts) — Bewertung (Bewertungs-Wahrheit)
- [`scripts/validate-module.mjs`](../scripts/validate-module.mjs) — Validierung vor dem Import
- [`docs/AUTOR-WORKFLOW.md`](AUTOR-WORKFLOW.md) — Schritt-für-Schritt-Modulerstellung mit KI
- [`supabase/seeds/0002_modul_suchen.sql`](../supabase/seeds/0002_modul_suchen.sql) — vollständiges Referenz-Modul
- [ADR-0011](adr/0011-bestehens-schwelle-pro-zuweisung.md) — Schwelle pro Zuweisung
- [ADR-0012](adr/0012-feedback-rueckgabe-zyklus.md) — Feedback/Rückgabe ohne KI
