-- Migration 0002: Row-Level Security Policies
-- Sicherheitsmodell laut PLATTFORM_MANIFEST §5.
--
-- Zwei Auth-Welten:
--   * Lehrer:innen → Supabase Auth (auth.uid()). RLS schützt ihre Daten.
--   * Schüler:innen → eigenes Code+PIN-System, KEIN auth.uid(). Ihre DB-Zugriffe
--     laufen server-seitig über den Service-Role-Key (umgeht RLS) und sind durch
--     Application Logic class-scoped abgesichert.
--
-- Grundsatz: RLS auf ALLEN Tabellen an. Default = deny. Nur explizite Policies öffnen.
-- Die `anon`-Rolle bekommt gezielt nur öffentliche Lese-Zugriffe (published modules,
-- nicht-lehrer-exklusive materials).

-- ---------------------------------------------------------------------------
-- RLS aktivieren (alle 7 Tabellen)
-- ---------------------------------------------------------------------------
alter table public.teachers         enable row level security;
alter table public.classes          enable row level security;
alter table public.student_codes    enable row level security;
alter table public.modules          enable row level security;
alter table public.class_modules    enable row level security;
alter table public.student_progress enable row level security;
alter table public.materials        enable row level security;

-- ---------------------------------------------------------------------------
-- teachers — nur eigener Datensatz
-- ---------------------------------------------------------------------------
create policy "teachers_select_own"
  on public.teachers for select
  using (auth.uid() = id);

create policy "teachers_insert_own"
  on public.teachers for insert
  with check (auth.uid() = id);

create policy "teachers_update_own"
  on public.teachers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- classes — nur eigene Klassen
-- ---------------------------------------------------------------------------
create policy "classes_all_own"
  on public.classes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- ---------------------------------------------------------------------------
-- student_codes — nur Codes eigener Klassen (über classes.teacher_id)
-- ---------------------------------------------------------------------------
create policy "student_codes_all_own"
  on public.student_codes for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = student_codes.class_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = student_codes.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- modules — eigene voll verwaltbar; published für alle (auth + anon) lesbar
-- ---------------------------------------------------------------------------
create policy "modules_select_published_or_own"
  on public.modules for select
  using (is_published = true or auth.uid() = created_by);

create policy "modules_insert_own"
  on public.modules for insert
  with check (auth.uid() = created_by);

create policy "modules_update_own"
  on public.modules for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "modules_delete_own"
  on public.modules for delete
  using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- class_modules — nur Zuweisungen eigener Klassen
-- ---------------------------------------------------------------------------
create policy "class_modules_all_own"
  on public.class_modules for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_modules.class_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = class_modules.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- student_progress — Lehrer:in sieht Fortschritte eigener Klassen (read-only).
-- Schreibzugriff der Schüler:innen läuft server-seitig via Service Role.
-- ---------------------------------------------------------------------------
create policy "student_progress_select_own_classes"
  on public.student_progress for select
  using (
    exists (
      select 1
      from public.student_codes sc
      join public.classes c on c.id = sc.class_id
      where sc.id = student_progress.student_code_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- materials — öffentlich lesbar außer is_teacher_only (das ist nur für
-- eingeloggte Lehrer:innen sichtbar). Schreibzugriff nur server-seitig.
-- ---------------------------------------------------------------------------
create policy "materials_select_public"
  on public.materials for select
  using (is_teacher_only = false or auth.uid() is not null);
