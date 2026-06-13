<!-- AUTO-GENERIERT von scripts/export-schema.mjs — NICHT von Hand editieren.
     Regenerieren mit: pnpm export:schema -->

# Block-Felder (auto-generiert aus den Zod-Schemas)

Diese Tabelle wird aus `lib/schemas/blocks.ts` abgeleitet und ist daher
immer code-treu. Sie deckt die **Struktur** ab (welche Felder, welche Typen,
was Pflicht ist). **Fachliche Regeln** (z. B. „MC braucht ≥1 richtige
Option", Kreuzungs-Konflikte im Gitter) leben in `superRefine` und erscheinen
hier NICHT — die prüft `pnpm validate:module`. Prosa-Erklärungen + Beispiel-
JSON pro Typ stehen in [`MODUL-SPEZIFIKATION.md`](../MODUL-SPEZIFIKATION.md) §3.

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

### `infobox`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `title` | string | – |
| `content` | string | ✅ |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

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

### `live_poll`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `options` | Array (2–∞) von Objekt | ✅ |

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

### `match`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | – |
| `pairs` | Array (2–∞) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

### `memory`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `pairs` | Array (3–8) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

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

### `order`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `items` | Array (2–∞) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

### `quiz_poll`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `options` | Array (2–∞) von Objekt | ✅ |

### `reflection`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `prompt` | string | ✅ |
| `placeholder` | string | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

### `scale`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |
| `min` | integer (-9007199254740991–∞) | – |
| `max` | integer (-9007199254740991–∞) | – |
| `minLabel` | string | – |
| `maxLabel` | string | – |

### `scramble`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `instruction` | string | ✅ |
| `words` | Array (1–8) von Objekt | ✅ |
| `hint` | string | – |
| `maxAttempts` | integer (1–5) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

### `slide`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `title` | string | ✅ |
| `body` | string | – |
| `imageUrl` | string (uri) | – |

### `text`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `content` | string | ✅ |
| `imageUrl` | string (uri) | – |
| `category` | `theorie` \| `uebung` \| `reflexion` | – |

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

### `understanding`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | – |

### `word_cloud`

| Feld | Typ / Regeln | Pflicht |
| --- | --- | --- |
| `id` | string (Länge 1–∞) | ✅ |
| `question` | string | ✅ |

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

