<!-- AUTO-GENERIERT von scripts/export-schema.mjs — NICHT von Hand editieren.
     Regenerieren mit: pnpm export:schema -->

# Block-Felder (auto-generiert aus den Zod-Schemas)

Diese Tabelle wird aus `lib/schemas/blocks.ts` abgeleitet und ist daher
immer code-treu. Sie deckt die **Struktur** ab (welche Felder, welche Typen,
was Pflicht ist). **Fachliche Regeln** (z. B. „MC braucht ≥1 richtige
Option", Kreuzungs-Konflikte im Gitter) leben in `superRefine` und erscheinen
hier NICHT — die prüft `pnpm validate:module`. Pro Typ stehen unten zusätzlich
**KI-Hinweise + ein geprüftes Beispiel** (aus der Registry `lib/blocks/block-docs.ts`).
Ausführliche Prosa-Erklärungen: [`MODUL-SPEZIFIKATION.md`](../MODUL-SPEZIFIKATION.md) §3.

**Gemeinsam:** jeder Block hat `id` (string, eindeutig) + `type`.
23 Block-Typen total.

### `categorize`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | – |
| `buckets` | Array (2–4) von Objekt | ✅ |
| `items` | Array (2–∞) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- 2–4 buckets (benannte Behälter mit id+label) und ≥2 items.
- Jedes item.bucketId MUSS auf eine existierende bucket.id zeigen (= die richtige Lösung).
- Teilpunkte: Anteil korrekt einsortierter items.

**Antwort-Format:** Record<itemId, bucketId> — jedes item in seinen Behälter.

**Beispiel:**

```json
{
  "id": "cat1",
  "type": "categorize",
  "question": "Sortiere die Geräte nach EVA.",
  "buckets": [
    {
      "id": "e",
      "label": "Eingabe"
    },
    {
      "id": "a",
      "label": "Ausgabe"
    }
  ],
  "items": [
    {
      "id": "i1",
      "text": "Mikrofon",
      "bucketId": "e"
    },
    {
      "id": "i2",
      "text": "Lautsprecher",
      "bucketId": "a"
    },
    {
      "id": "i3",
      "text": "Webcam",
      "bucketId": "e"
    }
  ]
}
```

### `crossword`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `rows` | integer (2–15) | ✅ |
| `cols` | integer (2–15) | ✅ |
| `words` | Array (2–10) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- answer NUR Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.
- across belegt (row, col+i), down belegt (row+i, col).
- Kreuzende Wörter MÜSSEN am Schnittpunkt denselben Buchstaben haben.
- Im Zweifel Wörter ohne Kreuzung legen — Konflikte lehnt validate:module ab.

**Antwort-Format:** Record<"r,c", Buchstabe> — ein Buchstabe je Zelle.

**Beispiel:**

```json
{
  "id": "cw1",
  "type": "crossword",
  "instruction": "Löse das Kreuzworträtsel rund um den Computer.",
  "rows": 4,
  "cols": 4,
  "words": [
    {
      "id": "w1",
      "answer": "MAUS",
      "clue": "Zeigegerät zum Klicken",
      "direction": "across",
      "row": 0,
      "col": 0
    },
    {
      "id": "w2",
      "answer": "AKKU",
      "clue": "Speichert Strom im Laptop",
      "direction": "down",
      "row": 0,
      "col": 1
    }
  ]
}
```

### `fill_blank`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `text` | string | ✅ |
| `solutions` | Array (1–∞) von string | ✅ |
| `distractors` | Array von string | – |
| `strict` | boolean | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** binary

**🤖 KI-Hinweise:**
- Anzahl der Platzhalter {0} {1} … im Text MUSS exakt der Anzahl solutions entsprechen.
- Platzhalter durchnummerieren ab {0}; solutions in derselben Reihenfolge.
- distractors (optional) sind Zusatz-Wörter für den Wortpool.
- Tippfehler werden tolerant geprüft; strict:true erzwingt exakte Schreibweise (Fachbegriffe).

**Antwort-Format:** (string|null)[] — Wörter in Platzhalter-Reihenfolge.

**Beispiel:**

```json
{
  "id": "fb1",
  "type": "fill_blank",
  "text": "Eine {0} findet Webseiten und sortiert sie nach {1}.",
  "solutions": [
    "Suchmaschine",
    "Relevanz"
  ],
  "distractors": [
    "Tastatur"
  ]
}
```

### `hangman`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `words` | Array (1–6) von Objekt | ✅ |
| `maxWrong` | integer (3–10) | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- word NUR Großbuchstaben (ß als „SS"), 2–14 Zeichen. 1–6 Wörter.
- hint ist PFLICHT pro Wort — reines Raten ohne Hinweis ist frustrierend.
- maxWrong (3–10, Default 6) = erlaubte Fehlversuche pro Wort.

**Antwort-Format:** string[] — die gelösten word-ids.

**Beispiel:**

```json
{
  "id": "gal1",
  "type": "hangman",
  "instruction": "Errate das Wort Buchstabe für Buchstabe.",
  "maxWrong": 6,
  "words": [
    {
      "id": "w1",
      "word": "INTERNET",
      "hint": "Weltweites Netz aus Computern"
    },
    {
      "id": "w2",
      "word": "PASSWORT",
      "hint": "Geheim — schützt dein Konto"
    }
  ]
}
```

### `hotspot`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `imageUrl` | string (uri) | ✅ |
| `imageAlt` | string | – |
| `groups` | Array (0–6) von Objekt | – |
| `areas` | Array (0–20) von Objekt | ✅ |
| `revealZones` | boolean | – |
| `maxClicks` | integer (1–20) | – |
| `zoomable` | boolean | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial
> ⚠️ Nur im Editor mit Bild bauen — NICHT per KI-JSON.

**🤖 KI-Hinweise:**
- NICHT per KI-JSON bauen — Zonen werden im Editor auf einem echten Bild aufgezogen.
- Koordinaten x/y/r sind relativ zur Bildbreite (0–1), nicht in Pixeln.
- Mindestens eine Zone muss isCorrect:true sein (Publish-Gate).
- area-ids müssen eindeutig sein; Kreis-Zone braucht r, Rechteck width+height.

**Antwort-Format:** string[] — die angetippten area-ids.

**Beispiel:**

```json
{
  "id": "hs1",
  "type": "hotspot",
  "instruction": "Tippe alle Eingabegeräte im Bild an.",
  "imageUrl": "https://example.com/computer.jpg",
  "imageAlt": "Computer-Arbeitsplatz",
  "areas": [
    {
      "id": "a1",
      "label": "Tastatur",
      "x": 0.3,
      "y": 0.7,
      "shape": "circle",
      "r": 0.1,
      "rotation": 0,
      "isCorrect": true
    },
    {
      "id": "a2",
      "label": "Bildschirm",
      "x": 0.5,
      "y": 0.3,
      "shape": "circle",
      "r": 0.12,
      "rotation": 0,
      "isCorrect": false
    }
  ]
}
```

### `infobox`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `title` | string | – |
| `content` | string | ✅ |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** theory · **Bewertung:** none

**🤖 KI-Hinweise:**
- Hervorgehobener „Merke"-Kasten — EIN prägnanter Kerngedanke, nicht mehrere.
- title ist optional; ohne title wird „Merke" angezeigt.

**Antwort-Format:** keine — reiner Inhalt, nicht bewertet.

**Beispiel:**

```json
{
  "id": "b2",
  "type": "infobox",
  "title": "Merke",
  "content": "Gib in Suchmaschinen nie persönliche Daten wie Adresse oder Passwort ein."
}
```

### `label_image`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `imageUrl` | string (uri) | ✅ |
| `imageAlt` | string | – |
| `zones` | Array (2–20) von Objekt | ✅ |
| `revealZones` | boolean | – |
| `zoomable` | boolean | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial
> ⚠️ Nur im Editor mit Bild bauen — NICHT per KI-JSON.

**🤖 KI-Hinweise:**
- NICHT per KI-JSON bauen — Zonen werden im Editor auf einem echten Bild gesetzt.
- label pro Zone ist PFLICHT = der richtige Soll-Begriff.
- 2–20 Zonen; Begriffe müssen eindeutig sein (sonst mehrdeutig).
- Koordinaten relativ (0–1); Kreis braucht r, Rechteck width+height.

**Antwort-Format:** Record<zoneId, Begriff> — jeder Zone ihren Begriff.

**Beispiel:**

```json
{
  "id": "li1",
  "type": "label_image",
  "instruction": "Beschrifte die Teile des Computers.",
  "imageUrl": "https://example.com/computer.jpg",
  "imageAlt": "Computer mit Bauteilen",
  "zones": [
    {
      "id": "z1",
      "label": "Maus",
      "x": 0.25,
      "y": 0.6,
      "shape": "circle",
      "r": 0.08,
      "rotation": 0
    },
    {
      "id": "z2",
      "label": "Bildschirm",
      "x": 0.55,
      "y": 0.3,
      "shape": "circle",
      "r": 0.12,
      "rotation": 0
    }
  ]
}
```

### `live_poll`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `options` | Array (2–∞) von Objekt | ✅ |

**Gruppe:** live · **Bewertung:** none

**🤖 KI-Hinweise:**
- Unbenotetes Meinungsbild — KEIN correct-Flag (anders als quiz_poll).
- Mindestens 2 Optionen. Beamer zeigt Balken nach „Ergebnis zeigen".

**Antwort-Format:** option-id (Stimme, in live_votes) — kein Score.

**Beispiel:**

```json
{
  "id": "p1",
  "type": "live_poll",
  "question": "Wie oft suchst du pro Tag im Internet?",
  "options": [
    {
      "id": "o1",
      "text": "Selten"
    },
    {
      "id": "o2",
      "text": "Ein paar Mal"
    },
    {
      "id": "o3",
      "text": "Ständig"
    }
  ]
}
```

### `mark_words`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `text` | string (Länge 1–∞) | ✅ |
| `correctIndices` | Array (1–∞) von integer (0–∞) | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- correctIndices sind 0-basierte WORT-Indizes (nur Wörter zählen, Satzzeichen nicht).
- Zähle die Wörter im text von 0 an, um die richtigen Indizes zu bestimmen.
- Teilpunkte: richtig markiert minus falsch markiert — Überschuss kostet Punkte.

**Antwort-Format:** number[] — die markierten Wort-Indizes.

**Beispiel:**

```json
{
  "id": "mw1",
  "type": "mark_words",
  "instruction": "Markiere alle persönlichen Daten.",
  "text": "Tim wohnt in der Mozartgasse 5 in Wien.",
  "correctIndices": [
    0,
    4,
    5,
    7
  ]
}
```

### `match`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | – |
| `pairs` | Array (2–∞) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** binary

**🤖 KI-Hinweise:**
- Mindestens 2 Paare; mindestens 2 UNTERSCHIEDLICHE category-Werte (sonst trivial).
- category ist der Text der Kategorie (kein id-Verweis) — gleiche Schreibweise konsistent halten.

**Antwort-Format:** Record<pairId, category> — jedem Begriff seine Kategorie.

**Beispiel:**

```json
{
  "id": "m1",
  "type": "match",
  "question": "Ordne zu: Eingabe oder Ausgabe?",
  "pairs": [
    {
      "id": "p1",
      "term": "Tastatur",
      "category": "Eingabe"
    },
    {
      "id": "p2",
      "term": "Bildschirm",
      "category": "Ausgabe"
    },
    {
      "id": "p3",
      "term": "Maus",
      "category": "Eingabe"
    }
  ]
}
```

### `memory`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `pairs` | Array (3–8) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- 3–8 Paare, jede pair-id eindeutig.
- Jede Karte (a und b) hat ENTWEDER text ODER imageUrl — nie beides, nie keins.
- Deckt Begriff–Begriff, Begriff–Definition oder Begriff–Bild ab.

**Antwort-Format:** string[] — die erfolgreich gefundenen pair-ids.

**Beispiel:**

```json
{
  "id": "mem1",
  "type": "memory",
  "instruction": "Finde die Paare: Gerät und seine Aufgabe.",
  "pairs": [
    {
      "id": "pa",
      "a": {
        "text": "Tastatur"
      },
      "b": {
        "text": "Texte eingeben"
      }
    },
    {
      "id": "pb",
      "a": {
        "text": "Bildschirm"
      },
      "b": {
        "text": "Bilder anzeigen"
      }
    },
    {
      "id": "pc",
      "a": {
        "text": "Drucker"
      },
      "b": {
        "text": "auf Papier ausgeben"
      }
    }
  ]
}
```

### `multiple_choice`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `options` | Array (2–∞) von Objekt | ✅ |
| `feedbackCorrect` | string | – |
| `feedbackWrong` | string | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** binary

**🤖 KI-Hinweise:**
- Mindestens 2 Optionen, davon mindestens EINE mit correct:true.
- Mehrere correct:true sind erlaubt (Mehrfachauswahl) — Schüler:in muss dann ALLE treffen.
- feedbackWrong sollte eine typische Falschvorstellung ansprechen.

**Antwort-Format:** string[] — die gewählten option-ids.

**Beispiel:**

```json
{
  "id": "mc1",
  "type": "multiple_choice",
  "question": "Welche Angaben sind persönliche Daten?",
  "options": [
    {
      "id": "o1",
      "text": "Deine Wohnadresse",
      "correct": true
    },
    {
      "id": "o2",
      "text": "Die Hauptstadt von Österreich",
      "correct": false
    },
    {
      "id": "o3",
      "text": "Dein Geburtsdatum",
      "correct": true
    }
  ],
  "feedbackWrong": "Allgemeinwissen wie Hauptstädte ist nicht „persönlich\"."
}
```

### `order`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `items` | Array (2–∞) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- items in der KORREKTEN Reihenfolge angeben — der Renderer mischt sie selbst.
- Mindestens 2 items. Teilpunkte über den Anteil korrekter Nachbarpaare.

**Antwort-Format:** string[] — die item-ids in gewählter Reihenfolge.

**Beispiel:**

```json
{
  "id": "ord1",
  "type": "order",
  "instruction": "Bringe die Schritte einer Suche in die richtige Reihenfolge.",
  "items": [
    {
      "id": "s1",
      "text": "Suchmaschine öffnen"
    },
    {
      "id": "s2",
      "text": "Suchbegriff eingeben"
    },
    {
      "id": "s3",
      "text": "Ergebnis anklicken"
    }
  ]
}
```

### `quiz_poll`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `options` | Array (2–∞) von Objekt | ✅ |

**Gruppe:** live · **Bewertung:** none

**🤖 KI-Hinweise:**
- Wie live_poll, aber mit correct-Flag pro Option. Das Flag geht NIE an Schüler:innen-Geräte.
- Erst beim Klick auf „Auflösen" markiert der Beamer die richtige Option.
- Mindestens eine Option mit correct:true.

**Antwort-Format:** option-id (Stimme, in live_votes) — kein Score-Beitrag.

**Beispiel:**

```json
{
  "id": "q1",
  "type": "quiz_poll",
  "question": "Was sortiert eine Suchmaschine?",
  "options": [
    {
      "id": "o1",
      "text": "Treffer nach Relevanz",
      "correct": true
    },
    {
      "id": "o2",
      "text": "Deine Dateien",
      "correct": false
    }
  ]
}
```

### `reflection`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `prompt` | string | ✅ |
| `placeholder` | string | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** none

**🤖 KI-Hinweise:**
- Offene Frage, freie Antwort — wird NICHT auto-bewertet (Lehrer:in liest selbst).
- Als Abschluss eines Moduls gedacht. placeholder ist optional.

**Antwort-Format:** string (Freitext der Schüler:in).

**Beispiel:**

```json
{
  "id": "r1",
  "type": "reflection",
  "prompt": "Wofür hast du diese Woche eine Suchmaschine benutzt?",
  "placeholder": "Schreibe 2–3 Sätze …"
}
```

### `scale`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `min` | integer (-9007199254740991–∞) | – |
| `max` | integer (-9007199254740991–∞) | – |
| `minLabel` | string | – |
| `maxLabel` | string | – |

**Gruppe:** live · **Bewertung:** none

**🤖 KI-Hinweise:**
- Bewertung auf einer Skala (Default 1–5). min/max sind ganze Zahlen.
- minLabel/maxLabel sind optionale Beschriftungen der Endpunkte.

**Antwort-Format:** Zahl auf der Skala (in live_votes) — kein Score.

**Beispiel:**

```json
{
  "id": "sc1",
  "type": "scale",
  "question": "Wie sicher fühlst du dich beim Suchen im Internet?",
  "min": 1,
  "max": 5,
  "minLabel": "Unsicher",
  "maxLabel": "Sehr sicher"
}
```

### `scramble`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `words` | Array (1–8) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- word NUR Großbuchstaben (ß als „SS"), 2–14 Zeichen. 1–8 Wörter.
- hint pro Wort ist optional, aber bei längeren Wörtern hilfreich.
- Die Buchstaben werden automatisch gemischt — du gibst nur das Lösungswort an.

**Antwort-Format:** Record<wordId, gebautes Wort> — je Wort die getippte Reihenfolge.

**Beispiel:**

```json
{
  "id": "sal1",
  "type": "scramble",
  "instruction": "Setze die Buchstaben zum richtigen Wort zusammen.",
  "words": [
    {
      "id": "w1",
      "word": "MAUS",
      "hint": "Zeigegerät"
    },
    {
      "id": "w2",
      "word": "TASTATUR",
      "hint": "Damit tippst du"
    }
  ]
}
```

### `slide`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `title` | string | ✅ |
| `body` | string | – |
| `imageUrl` | string (uri) | – |

**Gruppe:** theory · **Bewertung:** none

**🤖 KI-Hinweise:**
- Beamer-Folie für den geführten Einstieg (display_mode "presentation").
- title ist Pflicht, body optional. Knapp halten — wird groß projiziert.

**Antwort-Format:** keine — Präsentationsfolie, nicht bewertet.

**Beispiel:**

```json
{
  "id": "s1",
  "type": "slide",
  "title": "Was ist eine Suchmaschine?",
  "body": "Ein Werkzeug, das Webseiten findet und nach Relevanz sortiert."
}
```

### `text`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `content` | string | ✅ |
| `imageUrl` | string (uri) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** theory · **Bewertung:** none

**🤖 KI-Hinweise:**
- Reiner Erklärtext (Hook/Einleitung). Kurze Sätze, Du-Form, max ~20 Wörter.
- imageUrl ist optional und muss eine echte URL sein — im Zweifel weglassen.

**Antwort-Format:** keine — reiner Inhalt, nicht bewertet.

**Beispiel:**

```json
{
  "id": "b1",
  "type": "text",
  "content": "Eine Suchmaschine durchsucht das halbe Internet — in Sekunden."
}
```

### `true_false`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `answer` | boolean | ✅ |
| `feedbackCorrect` | string | – |
| `feedbackWrong` | string | – |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** binary

**🤖 KI-Hinweise:**
- answer ist ein boolean (true = Aussage stimmt).
- Aussage eindeutig formulieren — keine „manchmal/oft"-Grauzonen.

**Antwort-Format:** boolean — true oder false.

**Beispiel:**

```json
{
  "id": "tf1",
  "type": "true_false",
  "question": "Eine Suchmaschine speichert das ganze Internet auf deinem Gerät.",
  "answer": false,
  "feedbackWrong": "Sie durchsucht einen Index auf fremden Servern, nicht dein Gerät."
}
```

### `understanding`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | – |

**Gruppe:** live · **Bewertung:** none

**🤖 KI-Hinweise:**
- Verständnis-Ampel: feste 3 Optionen (🟢/🟡/🔴) — keine eigenen Optionen angeben.
- question ist optional. Schneller Stimmungs-Check am Ende einer Theorieeinheit.

**Antwort-Format:** Ampel-Signal (grün/gelb/rot, in live_votes) — kein Score.

**Beispiel:**

```json
{
  "id": "u1",
  "type": "understanding",
  "question": "Hast du verstanden, wie eine Suchmaschine arbeitet?"
}
```

### `word_cloud`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |

**Gruppe:** live · **Bewertung:** none

**🤖 KI-Hinweise:**
- Schüler:innen tippen ein Freitext-Wort (max 40 Zeichen). Beamer zeigt häufige Wörter größer.
- Nur eine Frage — keine Optionen.

**Antwort-Format:** string (ein Wort, in live_votes.free_text) — kein Score.

**Beispiel:**

```json
{
  "id": "w1",
  "type": "word_cloud",
  "question": "Welches Wort fällt dir zu „Internet\" ein?"
}
```

### `word_search`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `rows` | integer (5–15) | ✅ |
| `cols` | integer (5–15) | ✅ |
| `words` | Array (3–12) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

**Gruppe:** worksheet · **Bewertung:** partial

**🤖 KI-Hinweise:**
- word NUR Großbuchstaben (ß als „SS"). Jedes Wort darf nur einmal vorkommen.
- across (row, col+i), down (row+i, col), diag (row+i, col+i — nach rechts unten).
- Wörter dürfen sich kreuzen, müssen aber an geteilten Zellen denselben Buchstaben haben.
- 3–12 Wörter, Gitter 5×5 bis 15×15 — Wörter dürfen nicht aus dem Gitter ragen.

**Antwort-Format:** string[] — die gefundenen word-ids.

**Beispiel:**

```json
{
  "id": "wsr1",
  "type": "word_search",
  "instruction": "Finde die versteckten Computer-Wörter.",
  "rows": 7,
  "cols": 7,
  "words": [
    {
      "id": "w1",
      "word": "MAUS",
      "direction": "across",
      "row": 0,
      "col": 0
    },
    {
      "id": "w2",
      "word": "AKKU",
      "direction": "down",
      "row": 2,
      "col": 0
    },
    {
      "id": "w3",
      "word": "WLAN",
      "direction": "across",
      "row": 4,
      "col": 2
    }
  ]
}
```

