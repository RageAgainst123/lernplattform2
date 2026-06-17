-- Migration 0009: Live-Präsentation (Slide-Sync + Live-Poll)
--
-- Wenn eine Lehrer:in eine Präsentation startet, läuft pro Klasse GENAU EINE
-- aktive Session. Schüler:innen-Geräte pollen /api/live und leiten „ihre"
-- Session aus der jose-classId ab (keine geheime sessionId nötig → kein IDOR).
--
-- Sicherheitsmodell wie der Rest (siehe 0002): Lehrer:innen via RLS
-- (auth.uid() = teacher_id ihrer Klasse), Schüler:innen-Zugriffe laufen
-- server-seitig über den Service-Role-Key (kein auth.uid()).

-- ---------------------------------------------------------------------------
-- live_sessions — eine laufende Präsentation einer Klasse
-- ---------------------------------------------------------------------------
create table public.live_sessions (
  id                  uuid primary key default gen_random_uuid(),
  class_id            uuid not null references public.classes (id) on delete cascade,
  module_id           uuid not null references public.modules (id) on delete cascade,
  status              text not null default 'active' check (status in ('active', 'ended')),
  current_block_index smallint not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index live_sessions_class_id_idx on public.live_sessions (class_id);

-- GENAU EINE aktive Session pro Klasse. Der partielle Unique-Index ist das
-- harte Sicherheitsnetz gegen Doppel-Start (zwei Tabs/Doppelklick).
create unique index live_sessions_one_active_per_class
  on public.live_sessions (class_id)
  where status = 'active';

create trigger live_sessions_set_updated_at
  before update on public.live_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- live_votes — Stimmen einer Live-Poll-Folie
-- ---------------------------------------------------------------------------
create table public.live_votes (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.live_sessions (id) on delete cascade,
  block_id        text not null,
  option_id       text not null,
  student_code_id uuid not null references public.student_codes (id) on delete cascade,
  created_at      timestamptz not null default now(),
  -- Eine Stimme pro Kind und Frage; Re-Vote überschreibt (upsert auf diesem Key).
  unique (session_id, block_id, student_code_id)
);

create index live_votes_session_block_idx on public.live_votes (session_id, block_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.live_sessions enable row level security;
alter table public.live_votes    enable row level security;

-- live_sessions: Lehrer:in verwaltet nur Sessions EIGENER Klassen
-- (Muster class_modules_all_own, 0002). Schüler:innen brauchen keine Policy
-- (Lesen via Service-Role im Route Handler).
create policy "live_sessions_all_own"
  on public.live_sessions for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = live_sessions.class_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = live_sessions.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- live_votes: Lehrer:in LIEST Stimmen zu Sessions eigener Klassen (für den
-- Beamer-Ergebnisbalken). Schreiben der Stimmen läuft via Service-Role.
create policy "live_votes_select_own_classes"
  on public.live_votes for select
  using (
    exists (
      select 1
      from public.live_sessions ls
      join public.classes c on c.id = ls.class_id
      where ls.id = live_votes.session_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: Präsentation atomar starten
-- Beendet erst alle aktiven Sessions der Klasse, legt dann eine neue an —
-- in EINER Transaktion, damit der partielle Unique-Index nie kollidiert.
-- SECURITY DEFINER, aber die App ruft es nur hinter requireUser() auf; der
-- p_class-Parameter wird app-seitig auf eigene Klassen begrenzt (RLS auf
-- live_sessions greift zusätzlich beim normalen Zugriff).
-- ---------------------------------------------------------------------------
create or replace function public.start_live_session(p_class uuid, p_module uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.live_sessions
    set status = 'ended'
    where class_id = p_class and status = 'active';

  insert into public.live_sessions (class_id, module_id, status, current_block_index)
    values (p_class, p_module, 'active', 0)
    returning id into v_id;

  return v_id;
end;
$$;
