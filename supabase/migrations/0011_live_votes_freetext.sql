-- Migration 0011: Freitext-/Skalen-Stimmen für word_cloud, scale, understanding
-- option_id nullable: word_cloud nutzt free_text statt option_id.
-- scale + understanding nutzen weiterhin option_id (z.B. '3', 'green').
-- Längenschutz (max 40 Zeichen) wird applikationsseitig erzwungen.
alter table public.live_votes
  alter column option_id drop not null,
  add column if not exists free_text text;
