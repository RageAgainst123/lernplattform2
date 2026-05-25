-- Migration 0001: Initiales Schema (7 Haupttabellen)
-- Lernplattform Digitale Grundbildung — Datenmodell laut PLATTFORM_MANIFEST §3.
-- DSGVO: einzige PII-Stelle ist teachers.email. Schüler:innen sind anonym (Codename + PIN-Hash).

-- ---------------------------------------------------------------------------
-- Hilfsfunktion: updated_at automatisch pflegen
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.kompetenzbereich as enum (
  'orientierung',
  'information',
  'kommunikation',
  'produktion',
  'handeln'
);

create type public.material_type as enum (
  'theorie',
  'arbeitsblatt',
  'loesung',
  'stundenbild'
);

-- ---------------------------------------------------------------------------
-- teachers — Lehrer:innen-Profile (1:1 zu auth.users). Einzige PII-Stelle.
-- ---------------------------------------------------------------------------
create table public.teachers (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text unique not null,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger teachers_set_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- classes — Klassen einer Lehrer:in. Keine Schul-/Standortdaten.
-- ---------------------------------------------------------------------------
create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  name       text not null,
  schulstufe smallint check (schulstufe between 1 and 9),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_teacher_id_idx on public.classes (teacher_id);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- student_codes — anonyme Schüler:innen-Identifikatoren. Keine PII.
-- ---------------------------------------------------------------------------
create table public.student_codes (
  id             uuid primary key default gen_random_uuid(),
  class_id       uuid not null references public.classes (id) on delete cascade,
  codename       text not null,
  pin_hash       text not null,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz,
  unique (class_id, codename)
);

create index student_codes_class_id_idx on public.student_codes (class_id);

-- ---------------------------------------------------------------------------
-- modules — Lerneinheiten. Inhalt als JSONB (Block-Struktur).
-- ---------------------------------------------------------------------------
create table public.modules (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  schulstufe        smallint check (schulstufe between 1 and 9),
  kompetenzbereich  public.kompetenzbereich,
  topic             text,
  content           jsonb not null default '{"blocks": []}'::jsonb,
  estimated_minutes smallint,
  created_by        uuid references public.teachers (id) on delete set null,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index modules_created_by_idx on public.modules (created_by);
create index modules_is_published_idx on public.modules (is_published);

create trigger modules_set_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- class_modules — Zuweisungen von Modulen an Klassen.
-- ---------------------------------------------------------------------------
create table public.class_modules (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  module_id   uuid not null references public.modules (id) on delete cascade,
  due_date    date,
  assigned_at timestamptz not null default now(),
  unique (class_id, module_id)
);

create index class_modules_class_id_idx on public.class_modules (class_id);
create index class_modules_module_id_idx on public.class_modules (module_id);

-- ---------------------------------------------------------------------------
-- student_progress — Fortschritt pro Schüler:in-Modul-Kombination.
-- ---------------------------------------------------------------------------
create table public.student_progress (
  id                  uuid primary key default gen_random_uuid(),
  student_code_id     uuid not null references public.student_codes (id) on delete cascade,
  module_id           uuid not null references public.modules (id) on delete cascade,
  current_block_index smallint not null default 0,
  answers             jsonb not null default '{}'::jsonb,
  score               smallint not null default 0,
  max_score           smallint,
  completed_at        timestamptz,
  last_activity_at    timestamptz not null default now(),
  unique (student_code_id, module_id)
);

create index student_progress_student_code_id_idx on public.student_progress (student_code_id);
create index student_progress_module_id_idx on public.student_progress (module_id);

-- ---------------------------------------------------------------------------
-- materials — öffentliche PDFs für die Material-Bibliothek.
-- ---------------------------------------------------------------------------
create table public.materials (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  schulstufe      smallint check (schulstufe between 1 and 9),
  topic           text,
  material_type   public.material_type not null,
  file_path       text not null,
  is_teacher_only boolean not null default false,
  created_at      timestamptz not null default now()
);

create index materials_schulstufe_idx on public.materials (schulstufe);
