-- Migration 0018: Word-Heft via OneDrive-Sharing-Link (Phase Q).
--
-- Eine word_heft_links-Row enthält NUR die URL zum Word-Heft im OneDrive
-- der Schüler:in — keine Datei-Inhalte. Wir machen KEINEN Microsoft-Graph-
-- Zugriff (würde Files.ReadWrite-Scope verlangen, der seit Juli 2025 in
-- vielen Schul-Tenants den Admin-Consent-Screen triggert). Siehe ADR-0015.
--
-- Sicherheits-Modell:
--   - Schüler:in schreibt/liest eigene Rows (Service-Role, weil kein
--     auth.uid() für Schüler:innen)
--   - Lehrer:in liest Rows ihrer Klassen (User-Client + RLS)
--   - validation_status wird vom Server gesetzt nach HEAD-Request

create table public.word_heft_links (
  id                uuid primary key default gen_random_uuid(),
  student_code_id   uuid not null references public.student_codes (id) on delete cascade,
  topic_id          uuid references public.topics (id) on delete set null,
  one_drive_url     text not null,
  display_name      text,
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'ok', 'broken', 'unverified')),
  last_validated_at timestamptz,
  last_opened_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Pro Schüler:in × Thema EIN Word-Heft (kein topic_id = "freies Heft",
-- davon beliebig viele).
create unique index word_heft_links_student_topic_idx
  on public.word_heft_links (student_code_id, topic_id)
  where topic_id is not null;

-- Schneller Read-Pfad für /s-Dashboard: alle Hefte einer Schüler:in.
create index word_heft_links_student_idx
  on public.word_heft_links (student_code_id, created_at desc);

-- Updated-At-Trigger nutzt vorhandene set_updated_at-Funktion (Migration 0001).
create trigger set_updated_at_word_heft_links
  before update on public.word_heft_links
  for each row execute procedure public.set_updated_at();

-- RLS aktivieren
alter table public.word_heft_links enable row level security;

-- Lehrer:in einer Klasse liest alle Hefte ihrer Schüler:innen.
-- Schüler:in selbst schreibt via Service-Role (Application-Layer-Check über
-- jose-Session). Keine SELECT-Policy für Schüler:innen nötig — sie greifen
-- nie via auth.uid() darauf zu.
create policy "word_heft_links_select_own_class_students"
  on public.word_heft_links for select
  using (
    exists (
      select 1
      from public.student_codes sc
      join public.classes c on c.id = sc.class_id
      where sc.id = word_heft_links.student_code_id
        and c.teacher_id = auth.uid()
    )
  );

comment on table public.word_heft_links is
  'Phase Q: OneDrive-Sharing-Link-Referenzen für O365-Schüler:innen. Wir speichern nur URLs, keine Datei-Inhalte. Siehe ADR-0015.';
