-- Migration 0024: Teilpunkte-Fähigkeit (Lernformen-Vision 2.0, Phase 0)
--
-- Hintergrund: Die neuen Aufgabentypen (categorize, order, mark_words, hotspot)
-- liefern TEILPUNKTE — z.B. "3 von 4 Zuordnungen richtig" = 0.75. Bisher sind
-- student_progress.score + max_score als `smallint` (Ganzzahl) definiert, was
-- Teilpunkte still auf 0/1 runden würde. gradeBlock() in lib/blocks/evaluate.ts
-- gibt bereits 0.0–1.0 zurück (war von Anfang an dafür vorgesehen), aber die
-- Persistenz-Spalten müssen Brüche aufnehmen können.
--
-- Fix: score + max_score von smallint → numeric(6,2). Damit sind Werte wie
-- 7.5 / 10 oder 3.75 / 5 exakt speicherbar. numeric(6,2) erlaubt bis 9999.99 —
-- weit mehr als jedes Modul je an Blöcken hat.
--
-- Bestehende Ganzzahl-Werte werden beim Cast verlustfrei übernommen
-- (5 → 5.00). Kein Datenverlust, keine Neuberechnung nötig.
--
-- STOP-PUNKT für Geo: Diese Migration im Supabase-Dashboard ausführen.
-- Risiko: niedrig. ALTER COLUMN TYPE mit USING-Cast ist idempotent genug
-- (zweiter Lauf ist ein No-op, weil numeric→numeric nichts ändert).

alter table public.student_progress
  alter column score type numeric(6, 2) using score::numeric(6, 2);

alter table public.student_progress
  alter column max_score type numeric(6, 2) using max_score::numeric(6, 2);

-- Default für score bleibt 0 (numeric verträgt das). max_score bleibt nullable.

-- Sanity-Check (auskommentiert):
-- SELECT column_name, data_type, numeric_precision, numeric_scale
--   FROM information_schema.columns
--  WHERE table_name = 'student_progress'
--    AND column_name IN ('score', 'max_score');
