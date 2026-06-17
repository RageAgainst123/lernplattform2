-- Migration 0021: live_presence TTL via pg_cron
--
-- Pre-Launch-Scale-Audit QW-1 (2026-06-05): live_presence wächst unbounded.
-- Jeder Schüler-Poll (alle 5s) macht ein UPSERT. Bei 2500 aktiven Schüler:innen
-- = 500 Writes/Sek. Ohne TTL wird die Tabelle nach Tagen riesig, autovacuum
-- kommt nicht hinterher, DB-CPU klettert.
--
-- Fix: pg_cron-Job alle 2 Minuten löscht Einträge, deren last_seen_at älter
-- als 5 Minuten ist (= Schüler ist nicht mehr aktiv im Live-Polling).
-- Heartbeat-Tod in getActiveSessionForClass nutzt ohnehin schon ein 60s-
-- Fenster — 5 Min ist großzügig genug für legitime Tab-Wechsel.
--
-- STOP-PUNKT für Geo: Diese Migration im Supabase-Dashboard ausführen.
-- Falls pg_cron Extension nicht aktiviert ist: erst Extensions → pg_cron
-- aktivieren, dann diese Migration laufen lassen.

-- pg_cron-Extension aktivieren (idempotent, falls schon da).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Alten Job entfernen falls schon existiert (Re-run-Sicherheit).
SELECT cron.unschedule('cleanup-live-presence')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-live-presence'
  );

-- Neuer Cron-Job: alle 2 Minuten alte Presence-Einträge löschen.
SELECT cron.schedule(
  'cleanup-live-presence',
  '*/2 * * * *',
  $$DELETE FROM live_presence WHERE last_seen_at < now() - INTERVAL '5 minutes'$$
);

-- Sanity-Check: dieser SELECT sollte den Job zeigen.
-- SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'cleanup-live-presence';
