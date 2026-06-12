# Block-Roadmap — Lehrplan-Analyse → fehlende Lernblock-Typen

> **Quelle:** Lehrplan Digitale Grundbildung, BGBl. II Nr. 267/2022
> (Mittelschule, 1.–4. Klasse = 5.–8. Schulstufe), vollständiger Verordnungstext.
> **Methode:** jede „Die Schülerinnen und Schüler können…"-Kompetenz wurde
> gefragt: _Mit welchem Block-Typ übt man das interaktiv?_ Wo kein bestehender
> oder geplanter Typ passt, entsteht ein neuer Vorschlag.
> **Status:** 📋 Planungsgrundlage (2026-06-12). Geo priorisiert; gebaut wird
> Welle für Welle. Content-Produktion bleibt bis dahin pausiert
> (siehe CONTENT-PRODUKTION.md).

## §1 Was der Lehrplan konkret verlangt (Kurzfassung pro Klasse)

| Klasse         | Markante Kompetenzen (Auswahl)                                                                                                                                                                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. (St. 5)** | EVA-Prinzip + Geräte-Bestandteile · digital vs. analog · Suchmaschinen verstehen + Recherche · Daten speichern/ordnen · personenbezogene Daten schützen · **Algorithmen nachvollziehen, ausführen, selbst formulieren (Sequenzen, einfache Schleifen)** · einfache Berechnungen mit Daten · Umfragen planen/auswerten · Hardware-Komponenten benennen |
| **2. (St. 6)** | **Daten erfassen, filtern, sortieren, interpretieren, darstellen** · binäre Struktur/Formate/Größen von Daten · Pakete im Netzwerk (zerlegen → übertragen → zusammensetzen) · Fake News/Manipulation/**Phishing** · Lizenzmodelle (CC) · **Programme erstellen, testen, debuggen** · Hardware+Software als System                                     |
| **3. (St. 7)** | KI steuert Systeme · **Muster in Diagrammen erkennen, Vorhersagen treffen** · Cloud-Systeme · **Verschlüsselungsmethoden, sicheres Passwort, 2FA** · **Cybermobbing, Cybergrooming, Identitätsdiebstahl** · Computational Thinking → Programmiersprache · Barrierefreiheit · Malware-Schutz                                                           |
| **4. (St. 8)** | Grenzen/Möglichkeiten von KI · Datensicherung · Filterblase/Stereotype · Protokolle bei Datenübertragung · DSGVO + Recht am eigenen Bild · **Programme mit verschachtelten Schleifen + Konditionalen, Pseudocode** · **Software zur Verschlüsselung einsetzen** · virale Verbreitung                                                                  |

Auffällig: **Produktion verlangt in allen 4 Klassen explizit Algorithmen/
Programmieren** mit steigender Komplexität (Sequenz → Schleife → Debugging →
verschachtelte Kontrollstrukturen). Das ist die größte Lücke im heutigen
Block-Katalog — kein einziger Block übt das interaktiv.

## §2 Abdeckung heute (23 Typen) + bereits beschlossene Erweiterungen

**Gut abgedeckt:** Begriffe/Fakten (MC, true_false, fill_blank, match,
categorize, memory, crossword), Text-Analyse (mark_words: Phishing-Signale,
persönliche Daten), Bild-Arbeit (hotspot, label_image: Hardware!),
Reihenfolgen (order: Netzwerk-Pakete, Datensicherungs-Schritte),
Umfragen/Live (live_poll, quiz_poll, word_cloud, scale).

**Beschlossen (Geo, 2026-06-12):** ✅ **Welle 1 gebaut (2026-06-12):**
Wortsuchrätsel (`word_search`), Buchstabensalat (`scramble`),
Galgenmännchen (`hangman`). **Noch offen:** Millionenshow-Modus ·
Lernkarten (Flashcards) · Zeitstrahl · Zahlen-Eingabe + Schätz-Slider ·
Paare verbinden mit Linien.
Davon zahlen direkt auf den Lehrplan ein: **Zeitstrahl** (Medienwandel,
Geschichte der Digitalisierung — Orientierung alle Klassen), **Zahlen-Eingabe**
(Bit/Byte/Speichergrößen, „einfache Berechnungen mit Daten"), **Flashcards**
(Begriffs-Wiederholung vor Abschlusstests).

## §3 NEU aus der Lehrplan-Analyse — Blöcke, die noch niemand vorgeschlagen hat

| #   | Block                                    | Lehrplan-Anker                                                                              | Idee + Bewertung                                                                                                                                                                                             | Aufwand |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| L1  | **Befehls-Sequenz (Mini-Programmieren)** | Produktion 1.–4. Kl. (Sequenzen, Schleifen, Konditionale)                                   | Befehlskarten (vor/links/wiederhole 3×…) zusammenstecken, Figur läuft durch ein Gitter zum Ziel. Bewertung: Ziel erreicht + optimale Länge. Klassen-Progression: 1. Kl. nur Sequenz, ab 3. Kl. Schleifen/IF. | groß    |
| L2  | **Code-Debugging**                       | Produktion 2. Kl. („testen und debuggen")                                                   | Kurzer (Pseudo-)Code mit eingebauten Fehlern, Schüler:in tippt die Fehlerzeilen an — technisch ein mark_words für Code-Zeilen. Teilpunkte wie mark_words.                                                    | klein   |
| L3  | **Verschlüsselung (Caesar & Co.)**       | Kommunikation 3. Kl. (Verschlüsselungsmethoden), Handeln 4. Kl. (Verschlüsselungs-Software) | Interaktive Chiffrier-Scheibe: Text mit Verschiebung N ver-/entschlüsseln. Bewertung: exakter Zieltext.                                                                                                      | mittel  |
| L4  | **Passwort-Check**                       | Kommunikation 3. Kl. (sicheres Passwort, 2FA)                                               | Schüler:in baut ein Passwort, Live-Kriterien-Ampel (Länge, Zeichenmix, kein Wörterbuchwort, …). Bewertung: erfüllte Kriterien. Nie speichern, nur lokal prüfen!                                              | klein   |
| L5  | **Diagramm lesen**                       | Information 2.+3. Kl. (Daten interpretieren, Muster erkennen, Vorhersagen)                  | App rendert ein Balken-/Liniendiagramm aus Autor-Daten, darunter Fragen (Wert ablesen → Zahlen-Eingabe, Trend → MC). Kombi-Block aus Daten + Fragen.                                                         | mittel  |
| L6  | **Tabelle ausfüllen/sortieren**          | Information 2. Kl. (Daten erfassen, filtern, sortieren)                                     | Tabelle mit Lücken-Zellen oder Sortier-Auftrag. Bewertung pro Zelle.                                                                                                                                         | mittel  |
| L7  | **Chat-Szenario (Entscheidungs-Dialog)** | Kommunikation 2.–4. Kl. (Phishing, Cybermobbing, Cybergrooming, virale Inhalte)             | Simulierter Chat-/Mail-Verlauf; an Entscheidungspunkten wählt die Schüler:in eine Reaktion, der Verlauf verzweigt. Bewertung: Anteil sicherer/richtiger Entscheidungen. Einzigartig ggü. LearningApps & Co.  | groß    |
| L8  | **Binär-Umrechner-Übung**                | Information 2. Kl. (binäre Struktur), Produktion 2. Kl. (Zahlen als Symbole)                | Dezimal ↔ Binär mit klickbaren Bit-Karten (128/64/32/…). Bewertung: exakt. Alternativ als Aufgaben-Vorlage für Zahlen-Eingabe.                                                                               | klein   |

Bewusst NICHT als Block geplant: Texte/Präsentationen formatieren, Medien
produzieren, Webanwendungen bauen (Produktion 1.–4. Kl., praktischer Teil) —
das sind echte Werkzeug-Aufgaben (Word/PowerPoint/Scratch) mit Abgabe ins
Schulheft bzw. später evtl. ein Datei-Abgabe-Block; kein Auto-Grading sinnvoll.

## §4 Vorgeschlagene Bau-Reihenfolge (Wellen)

| Welle                          | Inhalt                                                                                     | Begründung                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 — Wort-Spiele**            | Wortsuchrätsel, Buchstabensalat, Galgenmännchen                                            | Klein, nutzen die vorhandene Gitter-/Shuffle-Infrastruktur (crossword/useShuffled), sofort spürbar mehr Abwechslung in JEDEM Thema.                          |
| **2 — Lehrplan-Pflicht klein** | Zahlen-Eingabe + Schätz-Slider, Binär-Übung (L8), Passwort-Check (L4), Code-Debugging (L2) | Kleine Blöcke, decken explizite Lehrplan-Punkte ab (Bit/Byte, Passwörter, Debugging).                                                                        |
| **3 — Lern-Formate**           | Lernkarten, Zeitstrahl, Paare-Linien, Tabelle (L6), Parsons-Puzzle (P2), Trace-Fragen (P4) | Didaktische Breite + Wiederholungs-Werkzeug für Abschlusstests; P2/P4 sind kleine Varianten bestehender Blöcke (order/mark_words + Code-Anzeige).            |
| **4 — Lehrplan-Stars groß**    | Verschlüsselung (L3), Diagramm lesen (L5)                                                  | Die Alleinstellungs-Blöcke unter den „normalen" Block-Typen.                                                                                                 |
| **5 — Spielmodi & Szenarien**  | Millionenshow-Modus, Chat-Szenario (L7)                                                    | Millionenshow ist ein Anzeige-Modus über MC-Blöcken; Chat-Szenario braucht ein Branching-Datenmodell — beides eher Modul-/Runner-Arbeit als „nur ein Block". |
| **6 — Robo-Welt**              | Befehls-Sequenz (L1/P1) als eigene Welle                                                   | Größtes Einzelstück der Roadmap (Simulator + Animations-Renderer + Level-Editor, mehrere Sessions) — siehe §6 Programmier-Strang.                            |

Danach (separater Track, vor Content-Produktion): Auswertungen
(Item-Analyse #255, Hausaufgaben-Modus #254) + Bewertungs-Workflow-Audit.

## §5 Arbeitsweise pro Block (bewährt seit memory/crossword)

Schema (+ superRefine) → Grading in evaluate.ts (PARTIAL_GRADERS wo sinnvoll)
→ Schüler-Renderer → Admin-Form → Stub/Katalog/LERNMODUL_BLOCKS →
Tests + Gates → eigener Commit + Tag. MODUL-SPEZIFIKATION.md pro Block
nachziehen, damit die KI ihn später per JSON erzeugen kann.

## §6 Programmier-Strang (Konzept, gestaffelt 1.–4. Klasse)

**Leitidee:** EIN gemeinsames System statt vier Block-Typen — die Staffelung
steckt in der Konfiguration. Didaktisch nach PRIMM (Predict → Run/Investigate
→ Modify → Make).

### Die 4 Bausteine

| #   | Baustein                                                                                                                                                                                                                                                                                                                                                                                                 | PRIMM-Phase            | Aufwand             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------- |
| P1  | **Robo-Welt (`code_sequence`)** — Gitterwelt (Wände, Ziel, Sammelobjekte; Level-Editor wie Hotspot-Editor). Schüler:in steckt Befehlskarten zusammen, Figur läuft Schritt für Schritt animiert. Verfügbare Karten pro Aufgabe konfigurierbar → Klassenstaffelung. Bewertung: Simulator (Ziel erreicht, Teilpunkte über Sammelobjekte, ⭐ bei ≤ optimaler Programmlänge — belohnt Schleifen automatisch). | Run/Investigate + Make | groß (eigene Welle) |
| P2  | **Parsons-Puzzle (`code_order`)** — gewürfelte Code-/Pseudocode-Zeilen ordnen; ab 4. Klasse mit Einrückung + Distraktor-Zeilen. Variante des `order`-Blocks.                                                                                                                                                                                                                                             | Modify                 | klein               |
| P3  | **Code-Debugging (`code_debug`)** — Fehlerzeilen antippen (mark_words auf Code-Zeilen); Ausbaustufe: Korrektur aus Dropdown wählen. = L2 aus §3.                                                                                                                                                                                                                                                         | Modify                 | klein               |
| P4  | **Trace-Fragen** — Code-Schnipsel-Anzeige (Monospace, Zeilennummern) + bestehendes MC / Zahlen-Eingabe: „Was gibt das Programm aus?" Kein eigener Grading-Typ nötig.                                                                                                                                                                                                                                     | Predict                | klein               |

### Staffelung über die Befehlskarten der Robo-Welt

| Klasse     | Verfügbare Karten / Modus                                                        | Lehrplan-Anker                                                                                      |
| ---------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1. (St. 5) | nur `vor`, `drehen`, `Aktion`                                                    | „Algorithmen nachvollziehen, ausführen, selbstständig formulieren", „Sequenzen"                     |
| 1.–2.      | + `wiederhole N×`                                                                | „einfache Schleifen"                                                                                |
| 2. (St. 6) | Debug-Modus: fehlerhaftes Programm vorgegeben → reparieren                       | „Programme erstellen, **testen und debuggen**"                                                      |
| 3. (St. 7) | + `wenn Wand voraus…`, `wiederhole bis…`                                         | „Computational Thinking … in Programmiersprache umsetzen"                                           |
| 4. (St. 8) | + verschachtelte Schleifen, `wenn … und/oder …`; umschaltbare Pseudocode-Ansicht | „verschachtelte Schleifen und zusammengesetzte Konditionale", „Pseudocode, (graphische) Notationen" |

**Level-Serien:** 4–5 Robo-Blöcke mit steigender Schwierigkeit = eine komplette
Programmier-Stunde mit Spiel-Gefühl.

**Bewusst extern:** „einfache Programme oder Webanwendungen mit geeigneten
Werkzeugen erstellen" (4. Kl.) bleibt bei Scratch/MakeCode als Projektarbeit
mit Doku im Schulheft — die App übt die Konzepte, die Tools die Praxis.

**Technik:** Simulator als pure Funktion (wie `crossword-grid.ts`), damit
testbar; superRefine prüft, dass die hinterlegte Musterlösung das Ziel
erreicht → unlösbare Level sind nicht speicherbar, Block ist KI-JSON-fähig.
