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
(diskriminierte Union). Vier Typen sind **automatisch bewertbar** (zählen zur
Prozent-Note), drei sind **nicht bewertbar** (reiner Inhalt bzw. freie Antwort).

## 2. Block-Typen auf einen Blick

| `type`            | Zweck                       | Auto-bewertbar? | Wo die Lösung steht                          |
| ----------------- | --------------------------- | --------------- | -------------------------------------------- |
| `text`            | Erklärtext                  | ❌ nein         | — (kein Eingabefeld)                         |
| `infobox`         | „Merke"-Kasten              | ❌ nein         | — (kein Eingabefeld)                         |
| `multiple_choice` | Mehrfachauswahl             | ✅ ja           | `options[].correct: true`                    |
| `true_false`      | Wahr/Falsch                 | ✅ ja           | `answer: true \| false`                      |
| `fill_blank`      | Lückentext                  | ✅ ja           | `solutions[]` (Reihenfolge der `{0}`,`{1}`…) |
| `match`           | Zuordnung Begriff→Kategorie | ✅ ja           | `pairs[].category`                           |
| `reflection`      | Freie offene Antwort        | ❌ nein         | — (manuell von Lehrer:in beurteilt)          |

> **Merksatz für die Bewertung:** `max_score` = **Anzahl der auto-bewertbaren
> Blöcke** (jeder zählt 1 Punkt). `score` = Summe der korrekt gelösten. Hat ein
> Modul **null** bewertbare Blöcke, ist `max_score = 0` und eine Prozent-Note
> ist **nicht anwendbar** (Anzeige neutral, nie „0 %").

## 3. Felder pro Block-Typ

Allgemein gilt für **jeden** Block: `id` (nicht-leerer String, **eindeutig** im
Modul) und `type` (einer der sieben Werte).

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

## 4. Wie die automatische Bewertung rechnet

Die gesamte Logik lebt in **`lib/blocks/evaluate.ts`** (und ist unit-getestet).
Sie ist **typ-agnostisch**: jede Auswertung läuft über `gradeBlock()` +
`isGraded()`, nie über eine fest verdrahtete Typ-Liste außerhalb dieser Datei.

| Funktion                          | Was sie liefert                                                          |
| --------------------------------- | ------------------------------------------------------------------------ |
| `isGraded(block)`                 | `true` für die 4 bewertbaren Typen, `false` für text/infobox/reflection. |
| `gradeBlock(block, answer)`       | **Teilergebnis 0.0–1.0** (heute binär: 0 oder 1).                        |
| `scoreModule(blocks, answers)`    | Summe der `gradeBlock`-Werte über alle bewertbaren Blöcke = `score`.     |
| `maxScore(blocks)`                | Anzahl bewertbarer Blöcke = `max_score`.                                 |
| `percentScore(score, max)`        | Gerundete Prozent, **oder `null`** wenn `max <= 0`.                      |
| `isPassed(score, max, threshold)` | `true`/`false`, **oder `null`** wenn keine Schwelle ODER `max = 0`.      |
| `blockResult(block, answer)`      | `'correct' \| 'wrong' \| 'ungraded'` (für die Detailansicht).            |

**Bestehens-Schwelle** (`pass_threshold`) lebt **pro Klassen-Zuweisung**, nicht
pro Modul (siehe ADR-0011). Ein Modul mit `max_score = 0` kann nie „bestanden"
oder „nicht bestanden" sein — die Anzeige bleibt neutral.

### Antwort-Formate (was der Renderer pro Block speichert)

Wichtig, falls du Seed-Daten oder Tests von Hand schreibst. Die Antworten liegen
als `Record<blockId, answer>` in `student_progress.answers`:

| Block-Typ         | Antwort-Format          | Beispiel                                  |
| ----------------- | ----------------------- | ----------------------------------------- |
| `multiple_choice` | `string[]` (Option-IDs) | `["o1"]` bzw. `["o1","o3"]`               |
| `true_false`      | `boolean`               | `false`                                   |
| `fill_blank`      | `(string\|null)[]`      | `["Crawler","Index"]` (Reihenfolge `{i}`) |
| `match`           | `Record<pairId,cat>`    | `{ "p1":"Technik", "p3":"Vorsicht" }`     |
| `reflection`      | `string`                | `"Ich nutze sie für …"`                   |

## 5. Pflicht-Checkliste vor dem Import

- [ ] Top-Level ist `{ "blocks": [ … ] }` (das Array allein geht auch durch das
      Validierungs-Script, der Editor erwartet aber das Objekt).
- [ ] Jede Block-`id` ist **eindeutig**.
- [ ] Jeder `multiple_choice` hat **≥ 1** Option mit `correct: true`; Options-`id`s eindeutig.
- [ ] Jeder `fill_blank`: **Anzahl `solutions` == höchster `{n}`-Index + 1**.
- [ ] Jeder `match`: **≥ 2 unterschiedliche** `category`-Werte; `pair`-`id`s eindeutig.
- [ ] Mindestens **ein** auto-bewertbarer Block, falls eine Prozent-Note erwünscht ist.
- [ ] `pnpm validate:module modul.json` läuft **grün**.

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
