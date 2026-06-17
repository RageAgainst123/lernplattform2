-- Migration 0014: Schulheft (portfolio_entries) — Phase H1.
--
-- Themenübergreifendes Lerntagebuch. Schüler:innen schreiben in eigenen
-- Worten — pädagogisch ein Konstruktions-Schritt (anders als Multiple-
-- Choice das nur Erkennen prüft). Inhalt als Tiptap-JSON-Doc, optional
-- mit Bezug zu einem Thema. Bilder kommen ausschließlich aus externer
-- Bibliothek (Pexels, Phase H2) — kein eigener Upload → DSGVO-trivial,
-- kein Storage-Verbrauch.
--
-- Sicherheits-Modell wie student_progress: Schüler:innen haben kein
-- auth.uid() → Service-Role-Schreibpfad. Die Owner-Prüfung passiert
-- applikationsseitig via jose-Session (studentCodeId).
-- Lehrer:in der eigenen Klasse darf die Einträge ihrer Schüler:innen
-- lesen (für die spätere H+4 Klassen-Heft-Übersicht).
-- Schreiben nur via Service-Role nach jose-Auth-Check in der Server-Action.

create table public.portfolio_entries (
  id              uuid primary key default gen_random_uuid(),
  student_code_id uuid not null references public.student_codes(id) on delete cascade,
  topic_id        uuid references public.topics(id) on delete set null,
  title           text,
  -- Tiptap-Doc als JSON. Default {} → leerer Editor lädt sauber.
  content_json    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Schneller Zugriff: alle Einträge einer Schüler:in nach Aktualität sortiert
-- (für /s/heft-Liste).
create index portfolio_entries_student_idx
  on public.portfolio_entries(student_code_id, updated_at desc);

-- Themen-Filter: alle Einträge zu einem Thema (für spätere Klassen-Übersicht).
create index portfolio_entries_topic_idx
  on public.portfolio_entries(topic_id);

-- Updated-At-Trigger wie in 0001 etabliert.
create trigger portfolio_entries_set_updated_at
  before update on public.portfolio_entries
  for each row execute function public.set_updated_at();

-- RLS aktivieren — Default-deny ist gewollt, Schreibpfade laufen über
-- Service-Role.
alter table public.portfolio_entries enable row level security;

-- SELECT-Policy für Lehrer:innen: sehen Einträge der Schüler:innen in
-- ihren eigenen Klassen. Schüler:innen-SELECT geht über Service-Role mit
-- expliziter studentCodeId-Prüfung in der Server-Action.
create policy "portfolio_select_own_class_students"
  on public.portfolio_entries
  for select
  using (
    exists (
      select 1
      from public.student_codes sc
      join public.classes c on c.id = sc.class_id
      where sc.id = portfolio_entries.student_code_id
        and c.teacher_id = auth.uid()
    )
  );
