-- Migration 0008: Anzeige-Modus 'presentation' für Module
-- Erweitert den display_mode-CHECK um 'presentation' (geführte Folien am Beamer,
-- Stundeneinstieg). Schema-seitig additiv — bestehende quiz/worksheet-Module
-- bleiben unverändert.
--
-- Migration 0006 hat den CHECK-Constraint INLINE/UNBENANNT gesetzt
-- (`check (display_mode in ('quiz','worksheet'))`). Postgres vergibt dann einen
-- generierten Namen (i. d. R. `modules_display_mode_check`). Wir droppen ihn
-- dynamisch über den Katalog (nicht raten) und legen einen benannten neu an.

do $$
declare
  v_constraint text;
begin
  select con.conname
    into v_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'modules'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%display_mode%';

  if v_constraint is not null then
    execute format('alter table public.modules drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.modules
  add constraint modules_display_mode_check
  check (display_mode in ('quiz', 'worksheet', 'presentation'));
