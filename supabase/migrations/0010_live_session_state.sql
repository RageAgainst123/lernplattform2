-- Migration 0010: Live-Session-Erweiterung (Heartbeat-Tod, Per-Block-State, Präsenz)
--
-- Baut auf 0009 auf. live_sessions.updated_at + der set_updated_at-Trigger existieren
-- bereits (0001 Funktion, 0009 Trigger auf live_sessions) — jedes UPDATE der Session
-- (Folienwechsel, Heartbeat, Reveal/Lock) frischt updated_at auf. Der Lese-Pfad
-- behandelt Sessions deren updated_at älter als 60 s ist als tot (Heartbeat-Tod) →
-- ein abgestürzter/hart geschlossener Beamer-Tab lässt das Overlay nach ≤60 s
-- verschwinden statt erst nach dem 4-h-created_at-Netz.

-- ---------------------------------------------------------------------------
-- 1) Per-Block-Steuerzustand (Reveal/Lock) direkt an der Session.
--    Pro Session ist immer nur EIN Block aktiv → zwei Spalten genügen, keine
--    separate Tabelle. Beide werden bei jedem Folienwechsel (setLiveBlock) auf
--    false zurückgesetzt: ein frischer Block ist verborgen (revealed=false) und
--    offen (locked=false). Genutzt ab Phase B (Ergebnis-Reveal, Abstimmung sperren).
-- ---------------------------------------------------------------------------
alter table public.live_sessions
  add column if not exists current_block_revealed boolean not null default false,
  add column if not exists current_block_locked   boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2) Präsenz-Tabelle: welche Geräte pollen gerade /api/live (= „verbunden").
--    Eine Zeile pro Kind/Session, beim Polling ge-upsertet (Service-Role).
--    Teilnehmerzähler am Beamer = COUNT(last_seen > now()-15s). Genutzt ab Phase B.
-- ---------------------------------------------------------------------------
create table if not exists public.live_presence (
  session_id      uuid not null references public.live_sessions (id) on delete cascade,
  student_code_id uuid not null references public.student_codes (id) on delete cascade,
  last_seen       timestamptz not null default now(),
  primary key (session_id, student_code_id)
);

create index if not exists live_presence_session_seen_idx
  on public.live_presence (session_id, last_seen);

alter table public.live_presence enable row level security;

-- Lehrer:in liest Präsenz der EIGENEN Klassen (Beamer-Teilnehmerzähler).
-- Schreiben (upsert) läuft über den Service-Role-Client im Route Handler —
-- Schüler:innen haben kein auth.uid(), brauchen also keine Schreib-Policy.
create policy "live_presence_select_own_classes"
  on public.live_presence for select
  using (
    exists (
      select 1
      from public.live_sessions ls
      join public.classes c on c.id = ls.class_id
      where ls.id = live_presence.session_id
        and c.teacher_id = auth.uid()
    )
  );
