-- Migration 0022: Composite-Index für Quiz-Quota-Performance
--
-- Pre-Launch-Scale-Audit QW-5 (2026-06-05): lib/db/quiz-quota.ts macht
-- bei jedem createQuizSession-Call ein COUNT-Query:
--   SELECT count(*) FROM quiz_sessions
--   WHERE class_id = ? AND created_at >= start_of_today
--
-- Heute: schnell weil Tabelle klein. Bei 100 Schulen × 10000 Quizzes/Tag
-- × 365 Tage = ~3.6 Mio Rows/Jahr. Ohne Composite-Index muss Postgres
-- den (vermutlich vorhandenen) class_id-Index nutzen und dann sequentiell
-- created_at filtern.
--
-- Composite-Index (class_id, created_at DESC) löst beide WHERE-Bedingungen
-- in einer Index-Scan. DESC weil heute > gestern > vorgestern abgefragt.
--
-- STOP-PUNKT für Geo: Diese Migration im Supabase-Dashboard ausführen.
-- Risiko: keiner. CREATE INDEX IF NOT EXISTS ist idempotent + non-blocking
-- bei kleinen Tabellen.

CREATE INDEX IF NOT EXISTS quiz_sessions_quota_idx
  ON quiz_sessions (class_id, created_at DESC);

-- Sanity-Check: dieser SELECT sollte den Index zeigen.
-- SELECT indexname, tablename FROM pg_indexes WHERE indexname = 'quiz_sessions_quota_idx';
