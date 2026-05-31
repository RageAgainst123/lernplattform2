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

1. Im Browser einloggen als Lehrer:in (Magic Link), dann auf `/admin/module/neu`.
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

1. Im Browser auf `/admin/material/neu`.
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

1. Zurück auf `/admin/module/<id>` → Checkbox „Veröffentlicht" → Speichern.
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

## 7. Lehrplan-Referenz

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

## 8. Querverweise

- [`docs/INHALTSKONZEPT.md`](INHALTSKONZEPT.md) — Material vs. Modul,
  Display-Modes, Status-Logik
- [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) — Farben/Spacing/Typografie
- [`docs/ROLES.md`](ROLES.md) — wer darf was
- [`arbeitsblaetter/_styles.py`](../arbeitsblaetter/_styles.py) — PDF-Bausteine
- [`arbeitsblaetter/gen_eva.py`](../arbeitsblaetter/gen_eva.py) — Referenz-Skript
- [`supabase/seeds/0001_modul_eva.sql`](../supabase/seeds/0001_modul_eva.sql) — Referenz-Modul-JSON
