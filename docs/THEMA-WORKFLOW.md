# Thema-Workflow — ein DGB-Thema als rundes Unterrichts-Paket

> **Zweck.** Diese Datei beschreibt das **didaktische Standard-Stundenbild** eines
> Themas und wie man es — KI-gestützt — als konsistentes Paket erstellt. Sie ist
> die Ebene **über** `docs/AUTOR-WORKFLOW.md`: AUTOR-WORKFLOW erklärt, _wie_ man
> die einzelnen Artefakte (Modul-JSON, PDF, Material) technisch baut;
> THEMA-WORKFLOW erklärt, _was_ ein gutes Thema ausmacht und _in welcher
> Reihenfolge_ es entsteht. Referenz-Thema: **EVA-Prinzip** (Orientierung, 5. Schulstufe), Seed `supabase/seeds/0001_modul_eva.sql`.
>
> Stand: 2026-05-30.

## 1. Was ein „Thema" ist — und das Ziel

Ein Thema deckt **eine Unterrichtsstunde (≈ 45 min)** und genau **eine
Lehrplan-Kompetenz** ab (BGBl. II 267/2022). Erfolg = eine Lehrer:in (oder Geo
selbst) kann das Thema **ohne Vorbereitung** unterrichten, weil das Paket
selbsterklärend ist.

Ein fertiges Thema besteht aus bis zu drei Artefakten mit **identischem
Topic-Namen** (z. B. „EVA-Prinzip"):

| Artefakt                  | Pflicht?    | Wo es lebt             | Wofür                                     |
| ------------------------- | ----------- | ---------------------- | ----------------------------------------- |
| **Interaktives Modul**    | ✅ ja       | `modules` (Block-JSON) | Schüler:innen am Gerät / im eigenen Tempo |
| **Arbeitsblatt-PDF**      | ⬜ optional | `materials` + Storage  | analoge Sicherung, Heft-Abheften          |
| **(später) Präsentation** | ⬜ Roadmap  | eigener `display_mode` | geführter Klassen-Einstieg (siehe §6)     |

## 2. Das Standard-Stundenbild (verbindliche Phasen-Reihenfolge)

Jedes Thema folgt **derselben** pädagogischen Dramaturgie. Das macht Themen für
Schüler:innen vorhersehbar und für die KI-Erstellung schematisierbar. Die Phasen
sind **didaktisch**, nicht technisch — im Modul-JSON bleiben sie ein **flaches
`blocks[]`-Array** (siehe `docs/MODUL-SPEZIFIKATION.md`; KEIN Phasen-Umbau des
Schemas).

| #   | Phase                  | Zweck                                  | Block-Typen (Auswahl)                                                                                                                          | Umfang     |
| --- | ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Hook/Einstieg**      | Neugier wecken, an Vorwissen anknüpfen | `text` (kurz, Frage/Alltag) ggf. + Bild                                                                                                        | 1 Block    |
| 2   | **Theorie**            | Kernidee klar + kindgerecht erklären   | `text` + `infobox` („Merke")                                                                                                                   | 2 Blöcke   |
| 3   | **Übung**              | Aktiv anwenden, Misconceptions prüfen  | `multiple_choice`, `true_false`, `fill_blank`, `match` — bei Bedarf `categorize`, `mark_words`, `order`, `hotspot`, `label_image` (Teilpunkte) | 3–5 Blöcke |
| 4   | **Reflexion/Transfer** | Auf eigenen Alltag übertragen          | `reflection`                                                                                                                                   | 1 Block    |
| 5   | **Sicherung (analog)** | Festigen auf Papier                    | → verknüpftes **Arbeitsblatt-PDF**                                                                                                             | 1 Material |

> Die volle Block-Typ-Liste (23 Typen, Felder + Beispiel-JSON) steht in
> [`docs/MODUL-SPEZIFIKATION.md`](MODUL-SPEZIFIKATION.md). Die Bild-Aufgaben
> (`hotspot`, `label_image`) baut man am einfachsten direkt im Admin-Editor.

**Reihenfolge im `blocks[]`-Array:** genau diese (Hook → Theorie → Übung →
Reflexion). Das EVA-Modul (`0001_modul_eva.sql`) ist die Referenz: b1 Hook/Theorie-
Text, b2 Merke-Infobox, b3–b6 vier Übungs-Blöcke (je ein Typ), b7 Reflexion.

**Daumenregeln:**

- **5–7 Blöcke** gesamt, davon **3–5 auto-bewertbare** (Übung). So ergibt die
  prozentuale Bewertung (`max_score` = Anzahl bewertbarer Blöcke) eine sinnvolle Zahl.
- Jeder der 4 auto-bewertbaren Typen **höchstens einmal** pro Thema → Abwechslung.
- **Sprache 5.-SSt.-tauglich:** Du-Form, Sätze < 20 Wörter, kein Beamtendeutsch.
- Mindestens **eine Misconception** in einem `feedbackWrong` adressieren.

## 3. Der Erstell-Workflow für ein Thema (Reihenfolge)

> Technische Detail-Schritte (Prompt-Templates, Import, PDF-Generierung) stehen in
> `docs/AUTOR-WORKFLOW.md`. Hier nur die **Reihenfolge auf Themen-Ebene**:

1. **Thema klären** — Lehrplan-Kompetenz + Topic-Name + Slug + 3–5 Misconceptions
   festlegen (AUTOR-WORKFLOW Schritt 1).
2. **Modul mit KI erzeugen** — entlang des Standard-Stundenbilds (§2). Das
   Prompt-Template in AUTOR-WORKFLOW §4 erzeugt bereits genau diese 7-Block-Struktur.
3. **Validieren** — `pnpm validate:module <datei.json>` MUSS grün sein
   (Schema + Logik-Regeln, siehe `docs/MODUL-SPEZIFIKATION.md`).
4. **Importieren + (noch nicht) veröffentlichen** — `/admin/module/neu`.
5. **Arbeitsblatt-PDF erzeugen** (optional, aber empfohlen) — KI + reportlab-Helper
   (AUTOR-WORKFLOW §5), als Material hochladen, mit Modul verknüpfen
   (`materials.related_module_id`, exakt gleicher Topic-String!).
6. **Veröffentlichen + zuweisen** — Modul publizieren, einer Klasse zuweisen.
7. **Smoke-Test** — als `5T-01` (TEST00 / PIN 0000) durchspielen, Lehrer:innen-
   Fortschrittsmatrix prüfen.

## 4. Qualitäts-Checkliste „Thema fertig"

- [ ] Genau **eine** Lehrplan-Kompetenz abgedeckt, Topic-Name konsistent überall
- [ ] Block-Reihenfolge = Standard-Stundenbild (Hook → Theorie → Übung → Reflexion)
- [ ] 5–7 Blöcke, 3–5 auto-bewertbar, jeder graded-Typ ≤ 1×
- [ ] `pnpm validate:module` grün
- [ ] Sprache 5.-SSt.-tauglich, ≥ 1 Misconception in `feedbackWrong`
- [ ] (falls PDF) Material-`topic` == Modul-`topic` (sonst bricht die Verknüpfung)
- [ ] End-to-End smoke-getestet (Schüler:innen-Durchlauf + Lehrer:innen-Matrix)

## 5. EVA-Prinzip als Referenz-Durchlauf

`supabase/seeds/0001_modul_eva.sql` ist das **kanonische Beispiel** und erfüllt
das Standard-Stundenbild bereits:

- **Hook + Theorie:** b1 erklärt EVA an einem Alltagsbild; b2 „Merke"-Infobox.
- **Übung:** b3 `multiple_choice` (Eingabegeräte, mit Misconception-Feedback),
  b4 `true_false` (Lautsprecher), b5 `fill_blank` (Eingabe/Ausgabe), b6 `match`
  (Geräte zuordnen).
- **Reflexion:** b7 `reflection` (eigenes Alltagsgerät analysieren).
- **Sicherung:** ein Arbeitsblatt-PDF kann ergänzt + verknüpft werden (noch offen).

→ Wenn ein neues Thema unsicher ist: EVA Block für Block als Vorlage nehmen und
denselben Rhythmus nachbauen.

## 6. Geführte Präsentation (Beamer-Stundeneinstieg)

Architektur-konformer Weg (Polling statt Realtime, kein Phasen-Umbau, kein
zweiter Auth-Pfad), gestuft:

- **Stufe 1 — GEBAUT:** statische geführte Präsentation. `display_mode='presentation'`
  - `slide`-Block; Lehrer:in blättert am Beamer durch
    (`/lehrer/klassen/[id]/praesentation/[moduleId]`, Buttons + Tastatur ←/→).
    Schüler:innen-Geräte bleiben dabei passiv (Default: „Schau nach vorne"). Kein
    Sync, kein Backend. Referenz-Seed: `supabase/seeds/0003_praesentation_eva.sql`.
- **Stufe 2 — geplant:** Slide-Sync via Polling (`live_sessions` + `/api/live`),
  optionaler Geräte-Modus „Folie spiegeln". MVP für echtes Live.
- **Stufe 3 — geplant:** Live-Poll (`live_poll`-Block + `live_votes`) — erst nach
  echtem Unterrichts-Feedback.

So baust du eine Präsentation: ein Modul mit `display_mode='presentation'` und
`slide`-Blöcken anlegen (Folientitel + optional Body/Bild), wie ein normales Modul
importieren/zuweisen, dann auf der Klassenseite bei dem Modul „Präsentieren".

Architektur-Begründung für die späteren Live-Stufen (warum Polling statt Realtime,
warum kein Phasen-Umbau): festgehalten in der Plan-Datei zur Präsentations-Roadmap.

## 7. Querverweise

- [`docs/CONTENT-PRODUKTION.md`](CONTENT-PRODUKTION.md) — Soll-Katalog (welche Themen pro Bereich×Stufe), Status-Matrix + Batch-Workflow
- [`docs/AUTOR-WORKFLOW.md`](AUTOR-WORKFLOW.md) — technische Schritt-für-Schritt-Erstellung + KI-Prompt-Templates
- [`docs/MODUL-SPEZIFIKATION.md`](MODUL-SPEZIFIKATION.md) — verbindliches Block-Format + Bewertung
- [`docs/INHALTSKONZEPT.md`](INHALTSKONZEPT.md) — Material vs. Modul, Navigations-Hierarchie, Status-Logik
- [`supabase/seeds/0001_modul_eva.sql`](../supabase/seeds/0001_modul_eva.sql) — Referenz-Thema EVA-Prinzip
- [`scripts/validate-module.mjs`](../scripts/validate-module.mjs) — Validierung vor dem Import
