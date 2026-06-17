-- Migration 0020: Quiz-Sessions (Phase S — Live-Klassen-Quiz im Kahoot-Stil)
--
-- Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md
-- Vorgängermigrationen: 0009 (live_sessions), 0010 (live_presence/Heartbeat-Tod).
--
-- Drei Tabellen für die Modi live_class, homework, team (Solo läuft NICHT
-- über dieses Schema, sondern bleibt in student_progress — siehe Spec §4).
--
-- Sicherheitsmodell wie üblich (vgl. 0002, 0009): Lehrer:innen via RLS
-- (auth.uid() = teacher_id ihrer Klasse), Schüler:innen-Schreibpfade laufen
-- server-seitig über Service-Role (kein auth.uid()).
--
-- Gegen Doppel-Start schützt ein partial-unique-Index (analog 0009).
-- Gegen Doppel-Antwort schützt UNIQUE(session, student, question_index) auf
-- quiz_answers — der Server kann „Reply-Race" einfach abfangen.
--
-- Heartbeat-Tod analog 0010: heartbeat_at < now() - interval '60 seconds'
-- → Session gilt als beendet (Lazy-Check beim Polling, keine Cron-Pflicht).

-- ---------------------------------------------------------------------------
-- 1) quiz_sessions — eine laufende oder geplante Quiz-Runde einer Klasse
-- ---------------------------------------------------------------------------
create table public.quiz_sessions (
  id                            uuid primary key default gen_random_uuid(),
  class_id                      uuid not null references public.classes (id) on delete cascade,
  module_id                     uuid not null references public.modules (id) on delete cascade,

  -- Modus bestimmt die UI-Pfade:
  --   'live_class' — Beamer + synchrones Polling
  --   'homework'   — asynchron, due_date, kein Beamer
  --   'team'       — Live-Variante, 1 Captain-Gerät pro Team
  --                 (Spec §7; team_mode-Flag deckt die Variante)
  mode                          text not null
    check (mode in ('live_class', 'homework', 'team')),

  -- State-Maschine (Spec §5.8):
  --   lobby              — Setup fertig, wartet auf Teilnehmer:innen-Beitritt
  --   active             — Frage läuft (current_question_index zählt mit)
  --   between_questions  — Reveal/Leaderboard, Lehrer:in klickt „Weiter"
  --   ended              — fertig (regulär oder via Heartbeat-Tod)
  -- Hausaufgaben-Sessions starten direkt in 'active' (keine Lobby).
  status                        text not null default 'lobby'
    check (status in ('lobby', 'active', 'between_questions', 'ended')),

  -- Frage-Reihenfolge wird beim Anlegen aus modules.content abgeleitet
  -- (match-Blocks rausgefiltert, optional shuffle). Damit ist die Reihenfolge
  -- stabil über die ganze Session, auch wenn Admin das Modul später ändert.
  question_order                jsonb not null default '[]'::jsonb,
  current_question_index        smallint not null default 0,
  current_question_started_at   timestamptz,

  -- Zeitlimit pro Frage (Live/Team: hartes Limit + Punkte-Formel-Basis;
  -- Homework: kein hartes Limit, aber Punkte-Formel-Basis bleibt 30s).
  time_limit_seconds            smallint not null default 30 check (time_limit_seconds between 5 and 300),
  scoring_time_limit_s          smallint not null default 30 check (scoring_time_limit_s between 5 and 300),

  -- Team-Flag (Spec §7). Mode='team' impliziert team_mode=true, aber die
  -- Spalte erlaubt auch zukünftige live_class-Variante mit Team-Toggle.
  team_mode                     boolean not null default false,

  -- Konfigurations-Flags (Spec §5.2). Defaults nach Setup-Form.
  show_leaderboard_between      boolean not null default true,
  shuffle_questions             boolean not null default false,
  shuffle_answers               boolean not null default true,

  -- Hausaufgaben-Frist (Spec §6.5, Lazy-Check). NULL für live_class/team.
  due_date                      timestamptz,

  -- Wer hat die Session gestartet (Audit + Lehrer:innen-Filter).
  started_by                    uuid not null references public.teachers (id) on delete cascade,

  -- Heartbeat-Tod analog 0010: Beamer-Tab pingt regelmäßig, ohne Heartbeat
  -- nach 60s gilt die Session als beendet (Spec §5.7).
  heartbeat_at                  timestamptz not null default now(),

  started_at                    timestamptz,
  ended_at                      timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index quiz_sessions_class_id_idx on public.quiz_sessions (class_id);
create index quiz_sessions_due_date_idx on public.quiz_sessions (due_date)
  where mode = 'homework' and status <> 'ended';

-- GENAU EINE laufende Quiz-Session pro Klasse (lobby/active/between_questions).
-- 'ended'-Rows bleiben für Auswertung erhalten und kollidieren nicht.
-- Schutz gegen Doppel-Start aus zwei Tabs oder zwei Lehrer:innen-Geräten.
create unique index quiz_sessions_one_active_per_class
  on public.quiz_sessions (class_id)
  where status in ('lobby', 'active', 'between_questions');

create trigger quiz_sessions_set_updated_at
  before update on public.quiz_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) quiz_participants — wer macht in einer Session mit
-- ---------------------------------------------------------------------------
create table public.quiz_participants (
  session_id      uuid not null references public.quiz_sessions (id) on delete cascade,
  student_code_id uuid not null references public.student_codes   (id) on delete cascade,

  -- Snapshot des Codenamens beim Join (Spec §5.3). Bleibt stabil, auch wenn
  -- der Codename in student_codes später geändert wird — der Auswertungs-
  -- Bericht der vergangenen Session zeigt weiterhin den damaligen Namen.
  display_name    text not null,

  -- Team-Modus: Teamname statt Codename am Beamer (Spec §7). NULL im
  -- Solo-/Live-Class-/Homework-Modus.
  team_name       text,

  -- Scoring-Aggregate (Live updated, Spec §5.4):
  total_points    integer not null default 0,
  current_streak  smallint not null default 0,
  longest_streak  smallint not null default 0,
  correct_count   smallint not null default 0,

  -- Heartbeat des Schüler:innen-Geräts (jeder /api/quiz-Poll setzt es neu).
  -- Disconnect-Karenz (Spec §5.9): last_seen > 30s alt → Default-Antwort 0
  -- Punkte für die laufende Frage.
  last_seen_at    timestamptz not null default now(),
  joined_at       timestamptz not null default now(),
  primary key (session_id, student_code_id)
);

create index quiz_participants_leaderboard_idx
  on public.quiz_participants (session_id, total_points desc);

-- Pro Session jeder Teamname nur einmal (Spec §7.3). Partial Index, damit
-- non-team-Sessions (team_name NULL) nicht kollidieren.
create unique index quiz_participants_unique_team
  on public.quiz_participants (session_id, team_name)
  where team_name is not null;

-- ---------------------------------------------------------------------------
-- 3) quiz_answers — eine Zeile pro (Session, Schüler:in, Frage)
-- ---------------------------------------------------------------------------
create table public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.quiz_sessions (id) on delete cascade,
  student_code_id uuid not null references public.student_codes  (id) on delete cascade,

  -- Index aus quiz_sessions.question_order (nicht block_id, weil derselbe
  -- block_id durch shuffle_questions an verschiedener Position landen kann).
  question_index  smallint not null,
  -- block_id zusätzlich für Item-Analyse + Distractor-Verteilung (S6 / Spec §5.7).
  block_id        text not null,

  -- Antwort (JSONB, weil Block-Typen unterschiedliche Antwort-Formate haben:
  -- string[] bei MC, boolean bei T/F, string bei Lückentext).
  -- NULL = „Frage verpasst" (Disconnect oder Timeout, Spec §5.4).
  answer          jsonb,
  is_correct      boolean not null,

  -- Zeit für die Punkte-Formel (lib/blocks/points.ts). Server-seitig
  -- validiert: 0 ≤ elapsed_ms ≤ scoring_time_limit_s * 1000 (cap im Code).
  elapsed_ms      integer not null,
  points_awarded  integer not null default 0,

  -- Hausaufgaben-Verdacht: elapsed_ms > 5 min markiert „Tab gewechselt"
  -- (Spec §6.4). Lehrer:innen-Auswertung zeigt gelbe Zeile mit Tooltip.
  suspicious      boolean not null default false,

  answered_at     timestamptz not null default now(),

  -- Idempotenz-Schutz: doppelter Submit derselben Frage wirft Conflict
  -- (Spec §5.10). Server fängt das als „bereits gespeichert" ab.
  unique (session_id, student_code_id, question_index)
);

create index quiz_answers_session_q_idx
  on public.quiz_answers (session_id, question_index);
create index quiz_answers_session_student_idx
  on public.quiz_answers (session_id, student_code_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.quiz_sessions     enable row level security;
alter table public.quiz_participants enable row level security;
alter table public.quiz_answers      enable row level security;

-- quiz_sessions: Lehrer:in verwaltet nur Sessions EIGENER Klassen (Muster
-- aus 0002/0009). Schüler:innen-Lesepfade laufen via Service-Role.
create policy "quiz_sessions_all_own"
  on public.quiz_sessions for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = quiz_sessions.class_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = quiz_sessions.class_id
        and c.teacher_id = auth.uid()
    )
  );

-- quiz_participants: Lehrer:in liest Teilnehmer:innen-Liste + Punkte für
-- Beamer-Anzeige + Auswertung. Schreiben (Join, Heartbeat, Punkte-Update)
-- läuft via Service-Role.
create policy "quiz_participants_select_own_classes"
  on public.quiz_participants for select
  using (
    exists (
      select 1
      from public.quiz_sessions qs
      join public.classes c on c.id = qs.class_id
      where qs.id = quiz_participants.session_id
        and c.teacher_id = auth.uid()
    )
  );

-- quiz_answers: Lehrer:in liest Antworten für Item-Analyse + Auswertung.
-- Schreiben (submitQuizAnswer) läuft via Service-Role.
create policy "quiz_answers_select_own_classes"
  on public.quiz_answers for select
  using (
    exists (
      select 1
      from public.quiz_sessions qs
      join public.classes c on c.id = qs.class_id
      where qs.id = quiz_answers.session_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: Quiz-Session atomar starten (analog start_live_session in 0009)
--
-- Beendet erst alle laufenden Quiz-Sessions der Klasse, prüft gegenseitige
-- Sperre mit live_sessions (Spec §3.11), legt dann die neue Session an —
-- alles in EINER Transaktion, damit der partielle Unique-Index nie
-- kollidiert UND keine Race zwischen Quiz und Live-Präsentation entstehen
-- kann.
--
-- SECURITY DEFINER, aber die App ruft die Funktion nur hinter requireUser()
-- auf; der p_class-Parameter wird app-seitig auf eigene Klassen begrenzt
-- (RLS auf quiz_sessions greift zusätzlich beim normalen Zugriff).
--
-- Wirft 'live_session_active' wenn eine Präsentation läuft → App soll das
-- als freundlichen Fehler an Geo zeigen ("Bitte erst Präsentation beenden").
-- ---------------------------------------------------------------------------
create or replace function public.start_quiz_session(
  p_class                  uuid,
  p_module                 uuid,
  p_mode                   text,
  p_question_order         jsonb,
  p_time_limit_seconds     smallint,
  p_scoring_time_limit_s   smallint,
  p_team_mode              boolean,
  p_show_leaderboard       boolean,
  p_shuffle_questions      boolean,
  p_shuffle_answers        boolean,
  p_due_date               timestamptz,
  p_started_by             uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_status text;
begin
  -- Konflikt-Check: keine aktive Live-Präsentation in der Klasse.
  if exists (
    select 1 from public.live_sessions
    where class_id = p_class and status = 'active'
  ) then
    raise exception 'live_session_active'
      using detail = 'Es läuft bereits eine Live-Präsentation in dieser Klasse.';
  end if;

  -- Alte Quiz-Sessions der Klasse beenden (lobby/active/between_questions
  -- werden alle abgebrochen). Bewusst auch lobby-Stände, damit ein
  -- vergessenes Setup nicht für immer blockiert.
  update public.quiz_sessions
    set status = 'ended', ended_at = now()
    where class_id = p_class
      and status in ('lobby', 'active', 'between_questions');

  -- Hausaufgaben-Sessions starten direkt in 'active' (keine Lobby).
  v_status := case when p_mode = 'homework' then 'active' else 'lobby' end;

  insert into public.quiz_sessions (
    class_id, module_id, mode, status,
    question_order, current_question_index,
    time_limit_seconds, scoring_time_limit_s,
    team_mode, show_leaderboard_between,
    shuffle_questions, shuffle_answers,
    due_date, started_by, started_at, heartbeat_at
  )
  values (
    p_class, p_module, p_mode, v_status,
    p_question_order, 0,
    p_time_limit_seconds, p_scoring_time_limit_s,
    p_team_mode, p_show_leaderboard,
    p_shuffle_questions, p_shuffle_answers,
    p_due_date, p_started_by,
    case when p_mode = 'homework' then now() else null end,
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;
