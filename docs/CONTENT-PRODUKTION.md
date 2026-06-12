# Content-Produktion — Soll-Katalog & Batch-Workflow

> **Was dieses Dokument ist:** der Masterplan für die Inhalts-Produktion.
> Die KI produziert Entwürfe, du (Geo) kuratierst, testest und gibst frei.
> Es ist ein **lebendes Arbeitsdokument** — die Status-Matrix in §3 wird
> nach jedem Batch aktualisiert (von der KI bei ⬜→🤖, von dir bei allem
> Richtung online).
>
> **Verweis-Dreieck:**
>
> - _Was bedeuten die Begriffe (Thema, Modul, Lernpfad)?_ → [INHALTSKONZEPT.md](INHALTSKONZEPT.md)
> - _Wie baut man EIN komplettes Thema?_ → [THEMA-WORKFLOW.md](THEMA-WORKFLOW.md)
> - _Wie läuft generieren → validieren → testen → freigeben?_ → [QUICKSTART-MODUL.md](QUICKSTART-MODUL.md)

## §1 Status-Legende

| Status             | Bedeutung                                                       | Wer setzt ihn          |
| ------------------ | --------------------------------------------------------------- | ---------------------- |
| 💡 **Vorschlag**   | Themen-Idee aus dem Lehrplan, noch nicht beauftragt             | KI (nur als Vorschlag) |
| ⬜ **geplant**     | Geo hat das Thema zur Produktion freigegeben                    | **NUR Geo**            |
| 🤖 **Entwurf**     | KI-JSON liegt validiert in `supabase/seeds/_drafts/`            | KI                     |
| 🧪 **im Test**     | Geo hat importiert und testet im „🎒 Als Schüler:in testen"-Tab | Geo                    |
| ✅ **freigegeben** | veröffentlicht + ggf. Klassen zugewiesen                        | **NUR Geo**            |
| ⏸ **geparkt**      | bewusst zurückgestellt (Grund in der Notiz-Spalte)              | Geo                    |

**Eiserne Regel: die KI bewegt ausschließlich ⬜→🤖.** Alles, was Inhalte
Richtung online bringt (🧪, ✅, Klassen-Zuweisung), macht Geo selbst. Ein 💡
wird erst durch dein ⬜ produktionsreif — streiche und ergänze die Matrix frei.

## §2 Mengengerüst

- **~25 Themen-Stunden pro Stufe und Schuljahr** (1 Wochenstunde DGB minus
  Puffer für Live-Stunden, Projekte, Tests).
- Ein Thema deckt typischerweise 1–2 Stunden ab (Lernmodul + optional
  Präsentation/Quiz/PDF).
- **Vollausbau:** 4–6 Themen pro Kompetenzbereich × Stufe.
  **Solides erstes Jahr:** 2–3 Themen pro Zelle.
- **Etappenziel:** zuerst Stufe 5 komplett (alle 5 Bereiche), dann 6, 7, 8 —
  so hat jede real unterrichtete Klasse zuerst etwas Ganzes.

## §3 Soll-Katalog (Status-Matrix)

> Initiales Skeleton mit 💡-Vorschlägen aus dem Lehrplan Digitale
> Grundbildung (BGBl. II 267/2022). **Geo: frei streichen, umformulieren,
> ergänzen — erst dein ⬜ macht ein Thema produktionsreif.**

### Orientierung — Wie funktionieren digitale Geräte und Systeme?

| Stufe | Thema                                            | Status | Modul/PDF                      | Notiz                           |
| ----- | ------------------------------------------------ | ------ | ------------------------------ | ------------------------------- |
| 5     | EVA-Prinzip                                      | ✅     | Lernmodul + Präsentation + PDF | Showcase-Thema                  |
| 5     | Digitale Geräte im Alltag                        | 💡     |                                | Eingabe/Ausgabe-Geräte benennen |
| 5     | Hardware-Bausteine (PC-Innenleben)               | 💡     |                                | gut für label_image (+BILD)     |
| 5     | Ordner, Dateien & Speichern                      | 💡     |                                | Betriebssystem-Basics           |
| 6     | Bit, Byte & Speichergrößen                       | 💡     |                                | Rechen-Aufgaben via fill_blank  |
| 6     | Wie kommt die Webseite zu mir? (Netzwerk-Basics) | 💡     |                                |                                 |
| 6     | App, Programm oder Web? (Software-Arten)         | 💡     |                                | categorize bietet sich an       |
| 7     | Wie das Internet funktioniert (IP, DNS, Server)  | 💡     |                                | order für Request-Ablauf        |
| 7     | Cloud oder lokal? Speicher-Orte verstehen        | 💡     |                                |                                 |
| 7     | Algorithmen im Alltag                            | 💡     |                                |                                 |
| 8     | Künstliche Intelligenz — Grundlagen              | 💡     |                                |                                 |
| 8     | Sensoren & Automatisierung (IoT)                 | 💡     |                                |                                 |
| 8     | Geschichte der Digitalisierung                   | 💡     |                                | order für Zeitleiste            |

### Information — Mit Daten und Informationen verantwortungsvoll umgehen

| Stufe | Thema                                    | Status | Modul/PDF       | Notiz                       |
| ----- | ---------------------------------------- | ------ | --------------- | --------------------------- |
| 5     | Suchen im Internet                       | ✅     | Lernmodul + PDF | Showcase-Thema              |
| 5     | Quellen vergleichen — was stimmt?        | 💡     |                 |                             |
| 5     | Ordnung halten: Dateien & Favoriten      | 💡     |                 |                             |
| 6     | Fake News erkennen                       | 💡     |                 | mark_words für Signalwörter |
| 6     | Bilder lügen: Bildwirkung & Manipulation | 💡     |                 | evtl. +BILD                 |
| 6     | Urheberrecht-Basics & freie Bilder       | 💡     |                 |                             |
| 7     | Quellenkritik & Faktencheck-Tools        | 💡     |                 |                             |
| 7     | Daten & Diagramme richtig lesen          | 💡     |                 |                             |
| 7     | Wikipedia richtig nutzen                 | 💡     |                 |                             |
| 8     | Deepfakes & KI-generierte Inhalte        | 💡     |                 |                             |
| 8     | Filterblase & Empfehlungsalgorithmen     | 💡     |                 |                             |
| 8     | Daten visualisieren                      | 💡     |                 | eher Produktions-Anteil     |

### Kommunikation — Digital kommunizieren und zusammenarbeiten

| Stufe | Thema                                            | Status | Modul/PDF | Notiz                               |
| ----- | ------------------------------------------------ | ------ | --------- | ----------------------------------- |
| 5     | Netiquette: höflich im Netz                      | 💡     |           |                                     |
| 5     | E-Mail & Teams — die Basics                      | 💡     |           | Schul-Alltag MS365                  |
| 5     | Regeln für den Klassenchat                       | 💡     |           |                                     |
| 6     | Cybermobbing — erkennen & handeln                | 💡     |           | sensibel, Du-Form besonders wichtig |
| 6     | Emojis, Tonfall & Missverständnisse              | 💡     |           | memory Begriff↔Bedeutung            |
| 6     | Gemeinsam an Dokumenten arbeiten                 | 💡     |           |                                     |
| 7     | Wie soziale Netzwerke funktionieren              | 💡     |           |                                     |
| 7     | Mein Profil, mein Bild: Online-Selbstdarstellung | 💡     |           |                                     |
| 7     | Messenger & Verschlüsselung                      | 💡     |           |                                     |
| 8     | Digitale Zivilcourage                            | 💡     |           |                                     |
| 8     | Influencer & versteckte Werbung                  | 💡     |           |                                     |
| 8     | Seriös kommunizieren: Online-Bewerbung           | 💡     |           |                                     |

### Produktion — Eigene digitale Inhalte gestalten und erstellen

| Stufe | Thema                                         | Status | Modul/PDF | Notiz                         |
| ----- | --------------------------------------------- | ------ | --------- | ----------------------------- |
| 5     | Text-Dokument gestalten (Word-Basics)         | 💡     |           | passt zum Word-Heft           |
| 5     | Meine erste Präsentation                      | 💡     |           |                               |
| 5     | Einfache Bildbearbeitung                      | 💡     |           |                               |
| 6     | Präsentieren wie ein Profi                    | 💡     |           |                               |
| 6     | Tabellenkalkulation-Basics                    | 💡     |           |                               |
| 6     | Erste Schritte Programmieren (Blöcke/Scratch) | 💡     |           |                               |
| 7     | Programmieren: Schleifen & Bedingungen        | 💡     |           | order für Code-Abläufe        |
| 7     | Video & Audio erstellen und schneiden         | 💡     |           |                               |
| 7     | Webseiten-Grundlagen (HTML)                   | 💡     |           |                               |
| 8     | Projekt: eigener App-/Website-Prototyp        | 💡     |           | eher Projektstunden als Modul |
| 8     | KI-Werkzeuge produktiv nutzen                 | 💡     |           |                               |
| 8     | Datenanalyse mit Tabellen                     | 💡     |           |                               |

### Handeln — Sicher, kritisch und selbstbestimmt im digitalen Raum

| Stufe | Thema                                      | Status | Modul/PDF | Notiz                    |
| ----- | ------------------------------------------ | ------ | --------- | ------------------------ |
| 5     | Sichere Passwörter                         | 💡     |           | Kandidat für Pilot-Batch |
| 5     | Meine Daten — was gebe ich preis?          | 💡     |           |                          |
| 5     | Bildschirmzeit & digitale Balance          | 💡     |           |                          |
| 6     | Privatsphäre-Einstellungen                 | 💡     |           |                          |
| 6     | Phishing & Betrugsmaschen                  | 💡     |           | mark_words in Fake-Mail  |
| 6     | In-App-Käufe & Kostenfallen                | 💡     |           |                          |
| 7     | Datenschutz & DSGVO-Basics                 | 💡     |           |                          |
| 7     | Mein digitaler Fußabdruck                  | 💡     |           |                          |
| 7     | Sexting & das Recht am eigenen Bild        | 💡     |           | sensibel                 |
| 8     | Online-Einkauf & Fake-Shops                | 💡     |           |                          |
| 8     | Digitale Spuren bei Bewerbungen            | 💡     |           |                          |
| 8     | Verschwörungserzählungen & Radikalisierung | 💡     |           | sensibel                 |

## §4 Pipeline pro Thema

1. **Start:** Thema steht in §3 auf ⬜ (von Geo gesetzt).
2. **KI erzeugt das Modul-JSON** nach dem Stundenbild aus
   [THEMA-WORKFLOW.md](THEMA-WORKFLOW.md). Dateiname:
   `supabase/seeds/_drafts/{stufe}-{bereich}-{slug}.json`
   (z. B. `5-handeln-sichere-passwoerter.json`).
3. **Optional PDF-Arbeitsblatt** nach [AUTOR-WORKFLOW.md](AUTOR-WORKFLOW.md) §5
   (Python-Generator mit `_styles.py`).
4. **Validate-Loop bis grün:** `pnpm validate:module <datei>` — Fehler
   korrigieren, erneut laufen lassen. Erst dann gilt der Entwurf als fertig.
5. **Matrix-Update auf 🤖.** Braucht das Thema ein hotspot/label_image
   (Bild-Koordinaten), in der Notiz-Spalte „+BILD" vermerken — diesen Block
   baut Geo im Editor (KI rät keine Koordinaten).
6. **Geo:** im Editor „JSON importieren" als Entwurf → Tab
   **„🎒 Als Schüler:in testen"** komplett durchspielen (🧪) →
   „Veröffentlicht" setzen + Thema/Klasse zuweisen (✅).

## §5 Qualitäts-Standards für KI-Module

- **Struktur:** 1 `text`-Hook (Alltagsbezug, 2–4 Sätze) → 1 `infobox`
  (Merksatz) → 3–5 Übungsblöcke → 1 `reflection` am Ende.
- **Block-Mix:** jeder Typ max. 1× pro Modul; mindestens 2 verschiedene
  Interaktionsformen; wo es passt 1 Spiel-Block (`memory`/`crossword`);
  Typen über den Batch rotieren (nicht 5 Module mit identischem Mix).
- **Sprache:** Du-Form, Sätze unter 20 Wörtern, österreichisches Deutsch,
  Beispiele aus der Lebenswelt 10–14-Jähriger.
- **`hint` auf jedem bewertbaren Block** — ein Denkanstoß, nie die Lösung.
- **`maxAttempts: 2`** als Standard; bei Abschlusstests 1.
- **Mindestens ein `feedbackWrong`,** das eine typische Fehlvorstellung
  (Misconception) direkt anspricht.
- **`hotspot`/`label_image` NIE per KI-JSON** — Koordinaten entstehen nur im
  Editor (siehe §4 Schritt 5).

## §6 Batch-Betrieb

- **1 Batch = 1 Kompetenzbereich × 1 Stufe** (max. 5 Themen) — klein genug
  zum seriellen Durchtesten, groß genug für einen runden Lernpfad.
- Die KI liefert: alle Draft-Dateien + validate-Nachweis + **EINE
  Zusammenfassungs-Tabelle** (Thema, Datei, Block-Mix, Besonderheiten) —
  keine 5 Einzel-Berichte.
- Matrix-Update ⬜→🤖, dann **ein Commit:**
  `content: batch <bereich>/<stufe> — N entwürfe + matrix-update`.
- Geo testet seriell; Korrektur-Notizen direkt in die Matrix-Zeile schreiben
  → KI fixt das JSON → Re-Import im Editor via **„Ersetzen"**.
- Optional Massen-Import per Seed-SQL: ist ein **STOP-Punkt** (Geo führt im
  Supabase-Dashboard aus), zwingend mit `is_published = false`.

## §7 Grenzen (konsistent mit AGENTS.md)

Die KI…

- **veröffentlicht nie** und weist nie Klassen zu,
- **schreibt nie in die Datenbank** (nur Dateien in `_drafts/` + Seed-SQL-Vorschläge),
- **rät keine Bild-Koordinaten** (hotspot/label_image → Editor),
- **erweitert den Katalog nur als 💡**, nie als ⬜,
- liefert ausschließlich Entwürfe, die `pnpm validate:module` grün bestehen.

Bei Widerspruch zwischen diesem Dokument und dem Code gewinnt der Code
(`lib/schemas/blocks.ts`, `lib/blocks/evaluate.ts`).
