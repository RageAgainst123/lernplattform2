# ADR 0012 — Lehrer:innen-Feedback & Rückgabe-Zyklus (ohne KI)

**Status:** accepted
**Datum:** 2026-05-30
**Erweitert:** ADR-0007 (4. Status-Stufe `returned`)

## Kontext

Lehrer:innen sollen Schüler:innen-Abgaben einsehen, beurteilen und mit Feedback
zur Überarbeitung zurückgeben können. Freie Texteingaben (`reflection`) lassen
sich nicht zuverlässig automatisch sinnbewerten.

## Entscheidung

- **Datenmodell:** `student_progress` bekommt `teacher_feedback` (text),
  `returned_at` (timestamptz) und `manual_marks` (jsonb, Freitext-Häkchen pro
  Block) — Migration 0007.
- **Rückgabe** setzt `completed_at = null` → die Schüler:in kann wieder editieren
  und neu abgeben. Beim erneuten Abgeben werden `returned_at`/`teacher_feedback`/
  `manual_marks` zurückgesetzt und der Score neu berechnet. Neuer Status
  `returned` in `ModuleStatus` (4. Stufe).
- **Sicherheit:** neue RLS-UPDATE-Policy `student_progress_update_own_classes`;
  alle Lehrer:innen-Schreibzugriffe über User-Client + RLS, **nie** Service-Role.
- **Auto-Bewertung teilpunkt-fähig vorbereitet:** `gradeBlock()` gibt 0.0–1.0
  zurück (heute binär), damit künftige Teilpunkte eine isolierte Änderung bleiben.
- **Keine KI:** Freitext wird manuell beurteilt (Häkchen + Feedback-Textfeld).

## Verworfen

- **LLM-Bewertung von Freitext (jetzt):** bräuchte Backend-Route, API-Key, Kosten
  und eine DSGVO-Prüfung (Schüler:innen-Texte an externen Dienst). Widerspricht
  dem „lokal/EU-only"-Prinzip — bewusst eine eigene spätere Phase mit eigener ADR.
- **Spaltengranulare RLS:** Postgres-Policies sind nicht spaltengranular; die
  Server-Action begrenzt die schreibbaren Felder fachlich auf `teacher_feedback`,
  `returned_at`, `completed_at`, `manual_marks`. Restrisiko nur durch die eigene
  Lehrer:in (kein Cross-Tenant-Leck).

## Konsequenzen

**Positiv:**

- Klassischer Korrektur-Zyklus: Abgabe → Rückgabe (mit Feedback) → Überarbeitung
  → erneute Abgabe (Score neu berechnet).
- Datenschutzkonform: keine externen Dienste, keine Schüler:innen-PII.

**Negativ / Risiko:**

- Quiz-Modus ist mechanisch ebenfalls rückgabefähig, das Feedback-Banner ist aber
  vorerst nur im Worksheet-Pfad verdrahtet (bewusster Scope-Schnitt; Quiz-Banner
  = Folge-Phase).
- Echte Teilpunkte (numeric `score`) sind vorbereitet, aber noch nicht umgesetzt.
