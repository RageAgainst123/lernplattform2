# Autor-Workflow — neue Module + Arbeitsblätter mit AI bauen

> Diese Datei ist die Anleitung für **Geo** (Autor:in / Admin). Sie zeigt
> Schritt für Schritt, wie ein neues DGB-Thema mit AI-Unterstützung
> entwickelt wird. Ziel: in **45–90 Minuten** ein vollständiges Paket
> aus Online-Modul + druckbarem Arbeitsblatt produzieren.
>
> Stand: 2026-05-30.

## 1. Was du am Ende hast

Ein „Topic" auf der Plattform besteht aus drei Artefakten, die alle
denselben **Topic-Namen** teilen (z. B. „Suchen im Internet"):

| Artefakt             | Wo es lebt                                          | Wie es entsteht                           |
| -------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Modul-JSON**       | DB-Tabelle `modules`                                | AI generiert es, Admin importiert         |
| **Druck-PDF**        | `arbeitsblaetter/*.pdf` (im Repo)                   | Python-Skript generiert                   |
| **Material-Eintrag** | DB-Tabelle `materials` + Storage-Bucket `materials` | Admin lädt PDF hoch + verknüpft mit Modul |

Auf der öffentlichen Seite `/dgb/<stufe>#<bereich>/<topic-slug>` erscheinen
PDF-Download UND „Online ausfüllen"-Button. (Der Bereich ist ein Hash-Anker
auf der Stufen-Seite, keine eigene Route — alte `/dgb/<stufe>/<bereich>`-URLs
werden per 308 dorthin umgeleitet.)

## 2. Der 8-Schritte-Prozess

### Schritt 1 — Thema und Lehrplan klären

1. Lehrplan-Bezug heraussuchen (BGBl. II 267/2022, siehe Abschnitt 7
   unten). Welche Kompetenz/en deckt das Thema ab? Notiere die Nummern,
   z. B. „K1.4 + K1.6".
2. Entscheide: **eine Unterrichtsstunde (45 min) = ein Topic**. Nicht
   versuchen, mehrere Kompetenzen auf einmal abzuhaken.
3. Topic-Anzeigetitel + Slug festlegen:
   - Anzeige: „Suchen im Internet"
   - Slug: `suchen-im-internet` (klein, Bindestriche, ASCII)
4. Misconceptions notieren, die das Thema adressieren soll (idealerweise 3–5).

### Schritt 2 — Modul-JSON mit AI generieren

1. Öffne einen frischen KI-Chat (Claude, ChatGPT, Gemini — egal welcher).
2. Kopiere das **Modul-Prompt-Template** aus Abschnitt 4 unten.
3. Füll die Variablen aus (`{TOPIC}`, `{SCHULSTUFE}`, `{BEREICH}`,
   `{LEHRPLAN_BEZUG}`, `{MISCONCEPTIONS}`, `{LERNZIELE}`).
4. Schick ab. Du bekommst valides JSON zurück mit 7 Blöcken.
5. **Quick Check:** Sprache 5.-SSt.-tauglich? Kein Beamtendeutsch?
   Korrekte Misconception-Behandlung?

### Schritt 3 — Modul-JSON importieren

1. Im Browser einloggen als Lehrer:in (Magic Link), dann auf
   `/admin/lernmodule/neu` (Phase E: drei separate Aktivitäts-Routen
   statt der alten Sammelroute `/admin/module`).
2. Metadaten ausfüllen:
   - Titel (Anzeigename)
   - Schulstufe + Kompetenzbereich + Topic (Anzeigetitel, nicht Slug!)
   - Beschreibung (1 Satz mit Lehrplan-Bezug)
   - Anzeige-Modus: **`worksheet`** (Standard für Arbeitsblatt-Topics)
   - Geschätzte Minuten
3. Spalte 2 → „JSON importieren" → das JSON aus Schritt 2 einfügen → „Ersetzen".
4. Falls Validierungs-Fehler: AI-Output korrigieren (oft sind die `id`-
   Felder eindeutig zu wählen oder `solutions` und `{0}`-Platzhalter
   widersprechen sich).
5. Speichern. **Noch NICHT veröffentlichen** — erst nach Schritt 7.

### Schritt 4 — PDF mit AI generieren

1. Im selben oder neuen KI-Chat.
2. Kopiere das **PDF-Prompt-Template** aus Abschnitt 5 unten.
3. Hänge das Modul-JSON aus Schritt 2 als Kontext an (damit Inhalte
   konsistent sind).
4. Du bekommst ein Python-Skript zurück, das die Helper aus
   `arbeitsblaetter/_styles.py` nutzt.

### Schritt 5 — PDF lokal generieren

1. Skript in `arbeitsblaetter/gen_<topic-slug>.py` speichern.
2. Im Terminal:
   ```bash
   python -m pip install reportlab    # nur einmalig
   python arbeitsblaetter/gen_<topic-slug>.py
   ```
3. PDF wird in `arbeitsblaetter/<topic-slug>-arbeitsblatt.pdf` erzeugt.
4. **Sichtprüfung:** PDF öffnen, durchblättern, Schreiblinien zählen,
   Lehrplan-Footer prüfen.

### Schritt 6 — PDF als Material hochladen

1. Im Browser auf `/admin/material/neu` (Phase E: auch erreichbar als
   `/admin/arbeitsblaetter/neu` — gleiche Seite, neue Aktivitäts-URL).
2. Felder ausfüllen:
   - Titel: „<Topic> — Arbeitsblatt" (z. B. „Suchen im Internet — Arbeitsblatt")
   - Material-Typ: **`arbeitsblatt`**
   - Schulstufe + Kompetenzbereich + Topic (**exakt derselbe String wie
     beim Modul** — Tippfehler bricht die Verknüpfung)
   - PDF-Datei aus `arbeitsblaetter/` hochladen
3. Speichern → landet auf der Detail-Seite.
4. Auf der Detail-Seite das **Modul-Dropdown** öffnen und das eben
   erstellte Modul auswählen. Speichern.

### Schritt 7 — Modul veröffentlichen + einer Klasse zuweisen

1. Zurück auf `/admin/lernmodule/<id>` → Checkbox „Veröffentlicht" → Speichern.
   (Bei Präsentationen: `/admin/praesentationen/<id>`. Alte URL
   `/admin/module/<id>` redirected automatisch zur richtigen Aktivität.)
2. **Modul der Klasse zuweisen** (Lehrer:innen-Sicht): auf
   `/lehrer/klassen/<id>` runter zur Modul-Sektion → Dropdown → Modul
   wählen → ggf. Fälligkeitsdatum → **Zuweisen**.
   - Damit erscheint das Modul im Schüler:innen-Dashboard `/s`.
   - Per Link „Klassen-Fortschritt ansehen →" gehst du jederzeit zur
     Matrix-Ansicht.

### Schritt 8 — Smoketesten

1. **Anonyme Vorschau:** `/dgb/<stufe>#<bereich>/<topic-slug>` öffnen.
   PDF-Download muss sichtbar sein.
2. **Schüler:innen-Test:** `/k` → `TEST00` → `5T-01` → PIN `0000` →
   Dashboard zeigt das Modul → öffnen → durchklicken → Abgeben.
3. **Lehrer:innen-Sicht prüfen:** `/lehrer/klassen/<id>/fortschritt` →
   die Status-Zelle der Schüler:in × Modul sollte jetzt „Fertig"
   (oder „Begonnen") zeigen.
4. Sobald alles passt: fertig. Im Repo: `git add arbeitsblaetter/gen_*.py
arbeitsblaetter/*.pdf supabase/seeds/*.sql && git commit`.

## 3. Validierungs-Checkliste vor dem Veröffentlichen

- [ ] Modul-JSON validiert (im Admin-Editor keine Fehler)
- [ ] PDF kompiliert ohne reportlab-Warnings
- [ ] Sprache 5.-SSt.-tauglich (Sätze < 25 Wörter, keine Fachbegriffe ohne
      Erklärung)
- [ ] 5–7 Aufgaben + 2–3 Theorie-Blöcke
- [ ] Reihenfolge: Theorie → Aufgaben → Reflexion
- [ ] `display_mode = 'worksheet'`
- [ ] Material `topic` = Modul `topic` (exakt gleicher String)
- [ ] Material `schulstufe` = Modul `schulstufe`
- [ ] Material `kompetenzbereich` = Modul `kompetenzbereich`
- [ ] `is_published = true` an Modul UND Material
- [ ] PDF-Header zeigt „Digitale Grundbildung · X. Schulstufe ·
      Arbeitsblatt"
- [ ] PDF-Footer zeigt Lehrplan-Marker (z. B. „DGB · 5. Schulstufe ·
      Bereich Information · K1.4 + K1.6")

## 4. Prompt-Vorlage „Modul" (copy-paste-fertig)

```text
Du hilfst mir, ein Lernmodul für die österreichische Lernplattform DGB
(Digitale Grundbildung, Sekundarstufe I) zu schreiben.

KONTEXT
- Plattform: lernplattform2 (eigene App, Next.js + Block-Engine)
- Schulstufe: {SCHULSTUFE}
- Kompetenzbereich: {BEREICH}   (orientierung | information | kommunikation | produktion | handeln)
- Thema: {TOPIC}
- Lehrplan-Bezug (BGBl. II 267/2022): {LEHRPLAN_BEZUG}
- Lernziele (in Schüler:innen-Sprache, 2-3 kurze Sätze): {LERNZIELE}
- Misconceptions, die ich addressieren will: {MISCONCEPTIONS}

AUFGABE
Schreib mir ein JSON mit 7 Blöcken nach dem Format unten. Worksheet-Modus.
- 1× text-Block (Erklärung, ca. 180 Zeichen, freundlich, Du-Form)
- 1× infobox „Merke" (ca. 90 Zeichen, prägnant)
- 1× multiple_choice (mit 4 Optionen, mind. 1 korrekt; Feedback-Texte
  für richtig + falsch)
- 1× true_false (Aussage + Antwort + beide Feedbacks)
- 1× fill_blank (Lückentext mit 2 Lücken `{0}`, `{1}`, dazu solutions
  und 2 distractors als Ablenkungswörter)
- 1× match (4 Paare in 2 Kategorien)
- 1× reflection (offene Schüler:innen-Antwort)

SPRACHE
- Du-Form, kurze Sätze (max 20 Wörter)
- Fachbegriffe einmal erklären, dann wiederverwenden
- Keine Anglizismen wo Deutsch geht
- Misconceptions adressieren (mind. eine in `feedbackWrong`)

JSON-SCHEMA (zwingend einhalten)
{
  "blocks": [
    { "id": "b1", "type": "text", "content": "..." },
    { "id": "b2", "type": "infobox", "title": "Merke", "content": "..." },
    { "id": "b3", "type": "multiple_choice", "question": "...",
      "options": [
        { "id": "o1", "text": "...", "correct": true|false },
        ...
      ],
      "feedbackCorrect": "...", "feedbackWrong": "..." },
    { "id": "b4", "type": "true_false", "question": "...",
      "answer": true|false,
      "feedbackCorrect": "...", "feedbackWrong": "..." },
    { "id": "b5", "type": "fill_blank",
      "text": "... {0} ... {1} ...",
      "solutions": ["wort1", "wort2"],
      "distractors": ["ablenkung1", "ablenkung2"] },
    { "id": "b6", "type": "match", "question": "...",
      "pairs": [
        { "id": "p1", "term": "...", "category": "..." },
        ...
      ] },
    { "id": "b7", "type": "reflection", "prompt": "...",
      "placeholder": "z. B. ..." }
  ]
}

GIB MIR NUR DAS JSON ZURÜCK, kein Drumherum. Bitte alle IDs eindeutig
und numerisch fortlaufend pro Typ.
```

## 5. Prompt-Vorlage „PDF" (copy-paste-fertig)

```text
Ich brauche ein Python-Skript, das mit `reportlab` ein druckbares
Arbeitsblatt-PDF erzeugt — passend zum folgenden Lern-Modul.

VORGABEN
- Speicherort: `arbeitsblaetter/gen_<TOPIC-SLUG>.py`
- Output-PDF: `arbeitsblaetter/<TOPIC-SLUG>-arbeitsblatt.pdf`
- Nutze AUSSCHLIESSLICH die Helper aus `arbeitsblaetter/_styles.py`
  (keine eigenen Farben, Spacings oder Fonts)
- Import als: `from . import _styles as s` (oder relative import wenn
  als Skript ausgeführt)

VERFÜGBARE HELPER
  s.make_doc(out_path)
  s.header(title, subtitle) -> Liste
  s.lernziele_box(items)
  s.theorie_box(text)
  s.merksatz_box(title, text)
  s.aufgabe_header(nr, titel) -> Paragraph
  s.mc_checkboxes(question, options) -> Liste
  s.wf_choices(question) -> Liste
  s.lueckentext_lines(intro, n_lines)
  s.write_lines(n)
  s.match_table(question, pairs, categories) -> Liste
  s.reflexion_lines(prompt, n_lines)
  s.footer_lehrplan(stufe, bereich, kompetenzen)
  s.vspace(mm_value)

LAYOUT
1. Header: Titel + Untertitel „Digitale Grundbildung · {SSt}. Schulstufe · Arbeitsblatt"
2. Lernziele-Box mit 2-3 Bullet-Punkten
3. Theorie-Box (basierend auf den Block-Inhalten Text + Infobox des Moduls)
4. Aufgaben 1-5 (basierend auf den interaktiven Blöcken des Moduls):
   - Multiple-Choice → mc_checkboxes
   - True/False → wf_choices
   - Lückentext → lueckentext_lines + write_lines (1-2 für die Lösungen)
   - Match → match_table
   - Reflexion → reflexion_lines (5 Schreiblinien)
5. Footer-Zeile mit Lehrplan-Marker

INHALTE (aus dem Modul-JSON unten übernehmen, aber PAPIER-tauglich
formulieren — kein „klicke", kein „tippe ein")

MODUL-JSON:
{MODUL-JSON-AUS-SCHRITT-2-EINFÜGEN}

GIB MIR NUR DAS PYTHON-SKRIPT ZURÜCK, kein Drumherum. Top der Datei mit
einem 3-Zeilen-Docstring der erklärt was es ist.
```

## 6. Häufige Fehler + Lösungen

| Fehler                                    | Ursache                                                                                               | Lösung                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| „Validierung schlägt fehl" im JSON-Import | Zod-Schema-Verstoß (z. B. `options` < 2, `solutions` leer, doppelte `id`)                             | AI auffordern: „Validiere bitte gegen das Schema in Abschnitt 4. Hier ist der konkrete Fehler: …"                               |
| Lückentext zeigt keine Wörter zur Auswahl | `{0}`/`{1}` im `text` matchen nicht mit `solutions`-Indizes                                           | `solutions.length` muss exakt der höchste Index im Text + 1 sein                                                                |
| Match-Aufgabe zeigt nur eine Kategorie    | Alle `pairs.category` sind gleich                                                                     | mind. 2 unterschiedliche Kategorien nötig                                                                                       |
| „Online ausfüllen"-Button erscheint nicht | Material und Modul haben unterschiedliche `topic`-Strings oder andere `schulstufe`/`kompetenzbereich` | Im Admin alle 3 Felder synchron setzen                                                                                          |
| PDF ist leer / reportlab-Error            | Listen-vs-Flowable-Verwechslung in `_styles.py`-Aufrufen                                              | Helper geben teils Listen (`mc_checkboxes`), teils einzelne Flowables (`aufgabe_header`) zurück — Doku in `_styles.py` lesen    |
| `import _styles` schlägt im Terminal fehl | Skript als `python arbeitsblaetter/gen_x.py` ausgeführt — kein Package-Kontext                        | Skript so anfangen: `import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).parent)); import _styles as s` |
| Farben weichen vom Web ab                 | Generator nutzt eigene Farben statt `_design_tokens.py`                                               | KEINE direkten Farb-Konstanten im Generator. NUR Helper-Aufrufe.                                                                |

## 7. Live-Module bauen (Presentation-Modus)

> Dieser Abschnitt ist der Pendant zu §4/§5, aber für **Live-Präsentationen am
> Beamer** statt Worksheet-Selbstbearbeitung. Lehrkraft führt durch, Klasse
> stimmt vom Tablet/Handy ab. `display_mode='presentation'`, keine PDF-Spur,
> keine Bewertung — Stimmen leben in `live_votes` und sind unbewertete
> Klassen-Stimmungsbilder. Volle Block-Typ-Liste in
> [`docs/MODUL-SPEZIFIKATION.md`](MODUL-SPEZIFIKATION.md) §3.8–3.13.

### Didaktische Stundendramaturgie für Live-Module

Bewährter Verlauf für eine ~45-min-Stunde mit 5–8 Blöcken:

| Phase          | Block-Vorschlag                                       | Zweck                                               |
| -------------- | ----------------------------------------------------- | --------------------------------------------------- |
| 1. Einstieg    | `live_poll` ODER `understanding`                      | Vorwissen aktivieren, alle „abholen"                |
| 2. Theorie     | 2–3 × `slide` (+ `text`/`infobox` falls Theorie tief) | Kernidee am Beamer erklären                         |
| 3. Aktivierung | `word_cloud` ODER `scale`                             | Anwenden, Vorstellungen sammeln                     |
| 4. Sicherung   | `quiz_poll`                                           | Verständnis prüfen mit richtiger Antwort + Auflösen |
| 5. Reflexion   | `understanding`                                       | Zwischenstand der Klasse einholen (Ampel)           |

**Daumenregeln:**

- **5–8 Blöcke** gesamt (≈ 5 min pro Block + Übergang).
- Beginne **immer** mit einem aktivierenden Block — nicht mit Theorie. Kinder
  haben das Handy in der Hand und wollen sofort etwas tun.
- Setze **maximal 1 `quiz_poll` pro Stunde**. Mehr fühlt sich wie eine Prüfung
  an, das ist nicht der Zweck.
- `understanding` ist ein **schnelles Signal**, kein voller Block — gut am
  Ende oder zwischendurch.
- Mische nicht: Worksheet-Aufgaben (`multiple_choice`, `fill_blank`, …)
  haben **keine** Beamer-Renderer und werden im Presentation-Modus stumm.

### Prompt-Vorlage „Live-Modul" (copy-paste-fertig)

```text
Du hilfst mir, ein Live-Präsentations-Modul für die österreichische
Lernplattform DGB (Digitale Grundbildung, Sekundarstufe I) zu schreiben.
Es wird in einer Schulstunde am Beamer gezeigt; Kinder stimmen vom Tablet
oder Handy ab.

KONTEXT
- Plattform: lernplattform2 (eigene App, Next.js + Block-Engine)
- Anzeige-Modus: presentation (Beamer + Schüler-Geräte)
- Schulstufe: {SCHULSTUFE}
- Kompetenzbereich: {BEREICH}   (orientierung | information | kommunikation | produktion | handeln)
- Thema: {TOPIC}
- Lehrplan-Bezug (BGBl. II 267/2022): {LEHRPLAN_BEZUG}
- Lernziele: {LERNZIELE}
- Stundendauer: ~45 min, ca. 5–8 Blöcke

AUFGABE
Schreib mir ein JSON mit 5–8 Blöcken nach dem Format unten. Folge dieser
Dramaturgie (Block-Reihenfolge ist verbindlich, Block-Typen austauschbar):

  1. EINSTIEG (1 Block): live_poll ODER understanding — kurze Aktivierungsfrage,
     holt alle ab, baut Spannung auf.
  2. THEORIE (2–3 Blöcke): slide-Folien mit Titel + kurzem Body. Falls eine
     vertiefte Erklärung nötig ist, ergänze EIN text- oder infobox-Block.
  3. AKTIVIERUNG (1 Block): word_cloud ODER scale — bringt Kinder dazu, Inhalt
     zu reproduzieren oder einzuschätzen.
  4. SICHERUNG (1 Block, optional): quiz_poll mit 3-4 Optionen, GENAU 1 richtig.
     Wird am Ende per „Auflösen" am Beamer gezeigt.
  5. REFLEXION (1 Block): understanding — Verständnis-Ampel zum Stundenausklang.

SPRACHE
- Du-Form, kurze Sätze (max 20 Wörter)
- Folientitel knackig (max 6 Wörter)
- Slide-Body als 1 Satz, nicht Absatz (Folie soll nicht voll sein)
- Quiz-Optionen alle plausibel — Distraktoren dürfen nicht offensichtlich
  falsch sein (z. B. NICHT „Maus" gegen „Banane", sondern „Maus" gegen
  „Drucker"/„Lautsprecher"/„Bildschirm")

JSON-SCHEMA (zwingend einhalten — Sub-Set der vollen Block-Schemas)
{
  "blocks": [
    { "id": "p1", "type": "live_poll", "question": "...",
      "options": [
        { "id": "o1", "text": "..." },
        { "id": "o2", "text": "..." }
      ] },
    { "id": "s1", "type": "slide", "title": "...", "body": "..." },
    { "id": "s2", "type": "slide", "title": "...", "body": "..." },
    { "id": "w1", "type": "word_cloud", "question": "Was fällt dir ein zu …?" },
    { "id": "q1", "type": "quiz_poll", "question": "...",
      "options": [
        { "id": "a", "text": "...", "correct": false },
        { "id": "b", "text": "...", "correct": true  },
        { "id": "c", "text": "...", "correct": false },
        { "id": "d", "text": "...", "correct": false }
      ] },
    { "id": "u1", "type": "understanding", "question": "Hast du das verstanden?" }
  ]
}

OPTIONALE Block-Varianten (nutze NUR wenn passend, statt dem obigen Default):
- scale (Selbsteinschätzung 1–5):
    { "id": "sc1", "type": "scale", "question": "Wie sicher fühlst du dich?",
      "min": 1, "max": 5, "minLabel": "gar nicht", "maxLabel": "sehr sicher" }
- text (vertiefte Erklärung neben einer Folie):
    { "id": "t1", "type": "text", "content": "Erklärungstext, ca. 200 Zeichen." }
- infobox (Merksatz):
    { "id": "i1", "type": "infobox", "title": "Merke", "content": "Kurzer Satz." }

VERBOTEN in Live-Modulen:
- multiple_choice, true_false, fill_blank, match, reflection — diese
  Worksheet-Aufgaben haben keine Beamer-Renderer.

GIB MIR NUR DAS JSON ZURÜCK, kein Drumherum. Alle IDs eindeutig.
```

### Live-Modul importieren + zuweisen

Gleicher Pfad wie Worksheet (siehe §3 oben):

1. `pnpm validate:module live-modul.json` — muss grün sein.
2. Admin-Editor `/admin/praesentationen/neu` → JSON-Import-Dialog → einfügen → speichern.
   (Für Live-Module — also Präsentationen mit Live-Polls, Wortwolken, Quiz etc. —
   ist das die richtige Route. Lernmodule mit Worksheet-Aufgaben gehören auf
   `/admin/lernmodule/neu`.)
3. **Wichtig:** `display_mode` im Editor auf `presentation` umstellen
   (Default ist `worksheet`).
4. Modul einer Klasse zuweisen.
5. Klasse öffnen → Modul-Karte → „Präsentation starten" → Beamer-Route lädt.

**Smoketest in 2 Browsern:** Lehrer-Tab am Beamer, ein Schüler-Tab via `/k/[code]`
einloggen. Pro Block durchklicken und sehen ob Eingabe + Beamer-Aggregat
stimmen.

## 8. Lehrplan-Referenz

Verordnung BGBl. II Nr. 267/2022 (Pflichtfach Digitale Grundbildung,
Sekundarstufe I, 5.–8. SSt., je 1 Wochenstunde). RIS:
<https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2022_II_267/BGBLA_2022_II_267.pdfsig>

5 Kompetenzbereiche × 4 Schulstufen (5.–8.) = 20 Sub-Bereiche. Frankfurt-Dreieck:
**T**echnisch · **G**esellschaftlich · **I**nteraktion.

### 5. Schulstufe (1. Klasse Sek I)

| Bereich       | Teilkompetenz (T/G/I)                | Stichworte                           |
| ------------- | ------------------------------------ | ------------------------------------ |
| Orientierung  | 1.1–1.3                              | Geräte, EVA-Prinzip, Hardware        |
| Information   | **1.4 (T)** Suchmaschinen kennen     | Crawler, Index, Ranking              |
| Information   | **1.5 (G)** Personalisierte Suche    | Filter, Bubble                       |
| Information   | **1.6 (I)** Recherchieren + bewerten | Quellen, Werbung, Wikipedia          |
| Information   | **1.7 (I)** Datei-Operationen        | speichern, kopieren, suchen, löschen |
| Kommunikation | 1.8–1.10                             | E-Mail, Chat, Netiquette             |
| Produktion    | 1.11–1.13                            | Text/Bild, einfache Tools            |
| Handeln       | 1.14–1.16                            | Datenschutz Basics, Mediennutzung    |

(Vollständige Wortlaute → RIS-Quelle oben oder
`docs/INHALTSKONZEPT.md` Abschnitt 3.)

### 6.–8. Schulstufe

Bauen aufeinander auf. Pro Stufe ein neuer Tabellen-Abschnitt sobald die
ersten Module dafür entstehen.

## 9. Querverweise

- [`docs/THEMA-WORKFLOW.md`](THEMA-WORKFLOW.md) — didaktisches Standard-Stundenbild
  eines Themas (die Ebene ÜBER diesem technischen Workflow)
- [`docs/MODUL-SPEZIFIKATION.md`](MODUL-SPEZIFIKATION.md) — die 13 Block-Typen
  im Detail (Felder, Beispiel-JSON, Bewertung)
- [`docs/INHALTSKONZEPT.md`](INHALTSKONZEPT.md) — Material vs. Modul,
  Display-Modes, Status-Logik
- [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) — Farben/Spacing/Typografie
- [`docs/ROLES.md`](ROLES.md) — wer darf was
- [`arbeitsblaetter/_styles.py`](../arbeitsblaetter/_styles.py) — PDF-Bausteine
- [`arbeitsblaetter/gen_eva.py`](../arbeitsblaetter/gen_eva.py) — Referenz-Skript
- [`supabase/seeds/0001_modul_eva.sql`](../supabase/seeds/0001_modul_eva.sql) — Referenz-Worksheet-Modul-JSON
- [`supabase/seeds/0005_interaktiv_demo.sql`](../supabase/seeds/0005_interaktiv_demo.sql) — Referenz-Live-Modul-JSON mit allen 5 Live-Block-Typen
