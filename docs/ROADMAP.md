# Roadmap — Lernplattform2

> Zentrale „Was ist fertig / was ist offen"-Übersicht für die laufende
> **Lernmodul-Vision 2.0** (reichere Aufgabentypen + DGB-Vokabeltrainer).
> Wird nach jeder abgeschlossenen Phase aktualisiert.
>
> Details: Aufgabentyp-Pattern in `docs/MODUL-SPEZIFIKATION.md`,
> Autor:innen-Workflow in `docs/AUTOR-WORKFLOW.md`, ältere Phasen im CHANGELOG.

## Phasen-Übersicht

| Phase | Was                                                                                                                                           | Status                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 0     | Teilpunkte-Fundament (numeric scores, `PARTIAL_GRADERS`)                                                                                      | ✅ fertig                         |
| A1    | `categorize` — Kategorien zuordnen (Chip-UI, Teilpunkte)                                                                                      | ✅ fertig + getestet              |
| A4    | `mark_words` — Markieren im Text (geteilte `tokenize.ts`)                                                                                     | ✅ fertig + getestet              |
| A2    | `order` — Reihenfolge sortieren (Teilpunkte via Anteil korrekter Nachbarpaare)                                                                | ✅ fertig + getestet              |
| A3    | `hotspot` — Bild-Hotspots (Kreis/Rechteck + Rotation, Gruppen-Modus, Upload + Pexels, Teilpunkte) + testbare Editor-Vorschau                  | ✅ fertig + getestet              |
| E1    | Score/Progress-Politur (Fortschrittsbalken im Worksheet, Teilpunkte-Aufschlüsselung)                                                          | 🔜 offen                          |
| B0–B6 | **DGB-Vokabeltrainer** + Spaced Repetition (Herzstück): Lexikon, Modul-Verknüpfung, SM-2, `/s/vokabeln`, `lesetext`-Tooltips, Lehrer-Diagnose | 🔜 offen                          |
| E2    | Mastery-Gamification (Begriffe-sicher-Anzeige)                                                                                                | 🔜 offen                          |
| D     | `step_by_step` — Schritt-für-Schritt-Block                                                                                                    | 🔜 offen                          |
| F     | **Selbst-Check + Abgabe-Schwelle** (Worksheet) — _bewusst ans Ende verschoben: erst wenn alle Module/Aufgabentypen stehen_                    | 🔜 geplant (Detailplan vorhanden) |

## Empfohlene Reihenfolge

**A2 ✅ → A3 ✅ → E1 → B0…B6 → E2 → D → F (zuletzt).** Nächster Schritt: **E1**.

Begründung: Erst die Inhalte reich machen (neue Aufgabentypen + Vokabeltrainer),
dann die „Abgabe-Disziplin" (Selbst-Check + Schwelle) als Schicht drüberlegen.

## Pro Phase (Definition of Done)

1. Gates grün: `pnpm lint && pnpm typecheck && pnpm test --run && pnpm build && pnpm format`
2. `pnpm validate:module` für neue Block-Typen grün
3. Showcase-Modul (`…c5e1ea7`) per Seed um den neuen Typ erweitert
4. Browser-Smoke: Schüler:in durchklicken + Lehrer:in-Korrektur prüfen
5. Doku (`MODUL-SPEZIFIKATION.md` / `AUTOR-WORKFLOW.md`) + CHANGELOG ergänzt
6. Commit (Conventional, Co-Authored-By) + Savepoint-Tag (`phase-<x>-savepoint`)

## Phase F im Detail (Selbst-Check + Abgabe-Schwelle)

Geos Befund: Schüler:innen geben im Worksheet-Modus voreilig ab → Lehrer muss
ständig zurückgeben. Lösung (alle Entscheidungen geklärt):

- **Selbst-Check** vor Abgabe: zeigt Gesamt-% + welche _Aufgaben-Nummern_ noch
  offen sind — **nie** die richtige Lösung. **Begrenzt** (Default 3×, im
  Modul-Editor einstellbar) → kein „Durchprobier-Knopf".
- **Abgabe-Schwelle**: weicher Hinweis unter X % („trotzdem abgeben?"), kein
  harter Block.
- **Ort**: pro Modul (neue `modules`-Spalten `submit_threshold` +
  `self_check_limit`, beide nullable = aus), analog zu `display_mode`.

Detail-Schrittplan liegt im lokalen Plan-File (gitignored, auf Geos Rechner).

## Nebenher offen (kein Roadmap-Blocker)

- **Quiz S5/S6**: Hausaufgaben-Modus (asynchrones Quiz mit Frist) + Lehrer-
  Item-Analyse — Backlog.
- **Pre-Launch C1**: Vercel + Supabase Spending-Limit ($50) — Dashboard-Task.
- **Deploy auf Vercel + eigene Domain** + Spenden-Integration — Backlog.

## Erledigte Vor-Phasen (Kontext)

V (class_topics als Source of Truth), W (Hint-Box + Mehrfachversuch),
Showcase-Modul, diverse Hotfixes (404, Quiz-Poll-Flash, Live-Poll-Semantik),
P0 (Teilpunkte-Fundament). Siehe CHANGELOG.
