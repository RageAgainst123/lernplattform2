-- Migration 0013: Themen als first-class Lernpfade
--
-- Phase G (Themen-Lernpfad): bisher ist `topic` nur ein loser Text-String auf
-- modules + materials. Jetzt formalisieren wir „Thema" zur eigenen Tabelle mit:
--   1. echter topics-Tabelle (id, slug, label, schulstufe, kompetenzbereich, description)
--   2. modules.topic_id + materials.topic_id als FK (text-topic bleibt als
--      Display-Notiz, FK ist neue Wahrheit)
--   3. modules.sort_order pro Thema (Lernpfad-Reihenfolge)
--   4. modules.activity_kind erweitert um 'quiz' und 'abschlusstest'
--      (heute nur 'lernmodul' | 'praesentation' — beide bleiben, neu dazu)
--   5. class_topics-Tabelle: pro Klasse welche Themen sind aktiv?
--
-- Idempotenz: alle CREATE TABLE / ALTER TABLE mit IF NOT EXISTS / IF EXISTS.
-- Bestands-Migration: vorhandene topic-Strings werden in topics-Zeilen extrahiert.

-- ─── 1) topics-Tabelle ──────────────────────────────────────────────────
create table if not exists public.topics (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null,                       -- URL-Slug (eva-prinzip)
  label             text not null,                       -- Anzeige-Name ("EVA-Prinzip")
  description       text,
  schulstufe        smallint check (schulstufe between 1 and 9),
  kompetenzbereich  public.kompetenzbereich,
  is_published      boolean not null default false,
  sort_order        integer not null default 0,           -- Reihenfolge innerhalb Bereich
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Slug pro (Stufe, Bereich) eindeutig — zwei „eva-prinzip" auf 5./Orientierung
-- macht keinen Sinn. Auf anderer Stufe schon (z.B. „Datenschutz" 5. + 6.).
create unique index if not exists topics_slug_unique
  on public.topics (schulstufe, kompetenzbereich, slug);

create index if not exists topics_stufe_bereich_idx
  on public.topics (schulstufe, kompetenzbereich, sort_order);

create trigger topics_set_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();

-- RLS für topics: alle dürfen lesen (öffentliche Themen-Browse auf /dgb/...).
-- Schreiben passiert ausschließlich über Service-Role im Admin-Bereich.
alter table public.topics enable row level security;

create policy "topics_select_all"
  on public.topics for select
  using (true);

-- ─── 2) modules.topic_id + sort_order ───────────────────────────────────
alter table public.modules
  add column if not exists topic_id uuid references public.topics(id) on delete set null,
  add column if not exists sort_order integer not null default 0;

create index if not exists modules_topic_id_idx on public.modules (topic_id, sort_order);

-- ─── 3) materials.topic_id ──────────────────────────────────────────────
alter table public.materials
  add column if not exists topic_id uuid references public.topics(id) on delete set null;

create index if not exists materials_topic_id_idx on public.materials (topic_id);

-- ─── 4) activity_kind erweitern um 'quiz' und 'abschlusstest' ───────────
-- 'lernmodul' und 'praesentation' aus Migration 0012 bleiben.
-- 'quiz' = Kahoot-Style Live-Quiz (zukünftig), 'abschlusstest' = Test mit
-- Voraussetzungen am Themen-Ende.
alter table public.modules
  drop constraint if exists modules_activity_kind_check;

alter table public.modules
  add constraint modules_activity_kind_check
    check (activity_kind in ('lernmodul', 'praesentation', 'quiz', 'abschlusstest'));

-- ─── 5) class_topics: pro Klasse aktive Themen ──────────────────────────
-- Lehrer:in „weist Thema einer Klasse zu" (statt einzelne Module). Bei
-- Bedarf kann Lehrer:in einzelne Bausteine über class_modules feintunen.
-- Erstmal: ein Thema zuweisen → automatisch alle published-Module + alle
-- Heft-Aufträge des Themas verfügbar.
create table if not exists public.class_topics (
  class_id    uuid not null references public.classes(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  due_date    date,
  primary key (class_id, topic_id)
);

create index if not exists class_topics_class_idx on public.class_topics (class_id);

alter table public.class_topics enable row level security;

-- RLS: Lehrer:in sieht/schreibt nur eigene Klassen.
create policy "class_topics_all_own"
  on public.class_topics for all
  using (
    exists (select 1 from public.classes c
            where c.id = class_topics.class_id
              and c.teacher_id = auth.uid())
  )
  with check (
    exists (select 1 from public.classes c
            where c.id = class_topics.class_id
              and c.teacher_id = auth.uid())
  );

-- ─── 6) Bestand-Migration: vorhandene topic-Strings extrahieren ─────────
-- Wir nehmen alle distinct (schulstufe, kompetenzbereich, topic)-Kombinationen
-- aus modules + materials und legen daraus topics-Zeilen an. Danach setzen
-- wir topic_id per Match. Bestehende topic-text-Spalten bleiben für
-- Rückwärts-Sichtbarkeit (Debug-Zwecke), neue Wahrheit ist topic_id.
do $$
declare
  rec record;
  new_topic_id uuid;
  slug_base text;
begin
  for rec in
    select distinct schulstufe, kompetenzbereich, topic
    from (
      select schulstufe, kompetenzbereich, topic from public.modules
      where topic is not null and topic <> ''
      union
      select schulstufe, kompetenzbereich, topic from public.materials
      where topic is not null and topic <> ''
    ) all_topics
  loop
    -- Slug aus Label generieren (lowercase + umlaute + spaces zu hyphens)
    slug_base := lower(rec.topic);
    slug_base := translate(slug_base, 'äöüÄÖÜß ', 'aouAOUs-');
    slug_base := regexp_replace(slug_base, '[^a-z0-9-]', '', 'g');
    slug_base := regexp_replace(slug_base, '-+', '-', 'g');
    slug_base := trim(both '-' from slug_base);

    -- Eindeutigkeit pro (Stufe, Bereich) — falls schon da, überspringen
    insert into public.topics (slug, label, schulstufe, kompetenzbereich, is_published)
    values (slug_base, rec.topic, rec.schulstufe, rec.kompetenzbereich, true)
    on conflict (schulstufe, kompetenzbereich, slug) do nothing
    returning id into new_topic_id;

    -- Wenn Insert übersprungen wurde, hole die existierende id
    if new_topic_id is null then
      select id into new_topic_id from public.topics
      where coalesce(schulstufe, -1) = coalesce(rec.schulstufe, -1)
        and coalesce(kompetenzbereich::text, '') = coalesce(rec.kompetenzbereich::text, '')
        and slug = slug_base;
    end if;

    -- modules + materials zuordnen
    update public.modules
       set topic_id = new_topic_id
     where coalesce(schulstufe, -1) = coalesce(rec.schulstufe, -1)
       and coalesce(kompetenzbereich::text, '') = coalesce(rec.kompetenzbereich::text, '')
       and topic = rec.topic
       and topic_id is null;

    update public.materials
       set topic_id = new_topic_id
     where coalesce(schulstufe, -1) = coalesce(rec.schulstufe, -1)
       and coalesce(kompetenzbereich::text, '') = coalesce(rec.kompetenzbereich::text, '')
       and topic = rec.topic
       and topic_id is null;

    new_topic_id := null;
  end loop;
end $$;

-- ─── 7) sort_order initialisieren ────────────────────────────────────────
-- Bestand-Module bekommen sort_order = ROW_NUMBER über (topic_id, created_at).
update public.modules m
   set sort_order = sub.rn
  from (
    select id, row_number() over (partition by topic_id order by created_at) as rn
    from public.modules
    where topic_id is not null
  ) sub
 where sub.id = m.id
   and m.sort_order = 0;

-- Bestand-Topics auch sort_order initialisieren (pro Stufe+Bereich nach Label)
update public.topics t
   set sort_order = sub.rn
  from (
    select id, row_number() over (
      partition by schulstufe, kompetenzbereich order by label
    ) as rn
    from public.topics
  ) sub
 where sub.id = t.id
   and t.sort_order = 0;
