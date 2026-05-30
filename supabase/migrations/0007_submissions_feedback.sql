-- Migration 0007: Bestehens-Schwelle pro Zuweisung + Lehrer:innen-Feedback & Rückgabe
--
-- Baustein C: pass_threshold lebt PRO ZUWEISUNG (class_modules), nicht pro Modul —
--   dieselbe Lerneinheit kann in Klasse A mit 80 %, in Klasse B mit 60 % bestanden
--   sein. NULL = keine Schwelle (neutral, abwärtskompatibel).
-- Baustein B: teacher_feedback + returned_at auf student_progress; Freitext-Häkchen
--   der Lehrer:in in manual_marks (jsonb). Neue RLS-UPDATE-Policy, damit Lehrer:innen
--   Feedback schreiben + completed_at zurücksetzen können — nur für Schüler:innen
--   ihrer eigenen Klassen.

-- C) Bestehens-Schwelle in Prozent (0–100). NULL = keine Schwelle.
alter table public.class_modules
  add column pass_threshold smallint
  check (pass_threshold is null or (pass_threshold between 0 and 100));

-- B) Feedback-Text + Rückgabe-Zeitstempel. NULL = kein Feedback / nicht zurückgegeben.
alter table public.student_progress add column teacher_feedback text;
alter table public.student_progress add column returned_at timestamptz;

-- B) Manuelle Freitext-Bewertung der Lehrer:in: { "<blockId>": true|false }.
-- {} = nichts markiert. Nur für reflection-Blöcke relevant (kein Auto-Scoring).
alter table public.student_progress
  add column manual_marks jsonb not null default '{}'::jsonb;

-- B) RLS: Lehrer:in darf student_progress-Rows der EIGENEN Klassen-Schüler:innen
-- aktualisieren. USING prüft den Vorher-Zustand, WITH CHECK den Nachher-Zustand —
-- beide an dieselbe class-scoped Bedingung gebunden (symmetrisch zur bestehenden
-- student_progress_select_own_classes). Keine INSERT-Policy: Feedback gibt es nur
-- zu bereits existierenden Abgaben (Row entsteht erst, wenn die Schüler:in beginnt).
create policy "student_progress_update_own_classes"
  on public.student_progress for update
  using (
    exists (
      select 1
      from public.student_codes sc
      join public.classes c on c.id = sc.class_id
      where sc.id = student_progress.student_code_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.student_codes sc
      join public.classes c on c.id = sc.class_id
      where sc.id = student_progress.student_code_id
        and c.teacher_id = auth.uid()
    )
  );
