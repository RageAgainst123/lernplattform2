-- Migration 0012: activity_kind als first-class Diskriminator auf modules
--
-- Phase E (Drei-Aktivitäten-Trennung): bisher ist alles ein „Modul" mit
-- display_mode ('quiz'|'worksheet'|'presentation') als einzigem Unterscheider.
-- Konzeptionell sind das aber DREI Aktivitäten:
--   1. Arbeitsblatt  → lebt in materials (PDF-Upload, unverändert)
--   2. Lernmodul     → modules mit activity_kind='lernmodul'
--                       (display_mode bleibt: 'quiz' | 'worksheet')
--   3. Präsentation  → modules mit activity_kind='praesentation'
--                       (display_mode für Präsentationen irrelevant)
--
-- Diese Migration legt activity_kind an und füllt es aus dem Bestand:
-- alle 'presentation'-Module bekommen 'praesentation', alle anderen 'lernmodul'.
-- display_mode bleibt unverändert (Rückwärtskompatibilität + Sub-Variante für Lernmodule).

-- 1) Spalte hinzufügen (nullable, damit der UPDATE läuft).
alter table public.modules
  add column if not exists activity_kind text;

-- 2) Bestand mappen: presentation → praesentation, alles andere → lernmodul.
--    where activity_kind is null macht die Migration idempotent (zweimal ausführen ist safe).
update public.modules
  set activity_kind = case
    when display_mode = 'presentation' then 'praesentation'
    else 'lernmodul'
  end
  where activity_kind is null;

-- 3) NOT NULL + Check-Constraint nachträglich, jetzt wo alle Zeilen einen Wert haben.
alter table public.modules
  alter column activity_kind set not null;

alter table public.modules
  drop constraint if exists modules_activity_kind_check;

alter table public.modules
  add constraint modules_activity_kind_check
    check (activity_kind in ('lernmodul', 'praesentation'));

-- 4) Index für die häufigste Filter-Query (Admin-Listen pro Aktivität, Schüler-Dispatcher).
create index if not exists modules_activity_kind_idx
  on public.modules (activity_kind);

-- display_mode-Constraint bleibt unverändert — er erlaubt weiterhin
-- ('quiz'|'worksheet'|'presentation'). Für Lernmodule ist nur quiz/worksheet
-- semantisch sinnvoll, für Präsentationen ist der Wert irrelevant. Die
-- Anwendung erzwingt das (im Editor wird display_mode nur bei Lernmodulen
-- als Auswahl angezeigt).
