-- Migration 0003: Beitrittscode pro Klasse (join_code)
-- Schüler:innen öffnen /k/<join_code>, um zur Login-Seite ihrer Klasse zu kommen.
-- Kurzer, gut lesbarer Code ohne verwechselbare Zeichen (kein 0/O/1/I/L).

-- Hilfsfunktion: zufälliger 6-stelliger Code aus sicherem Alphabet.
create or replace function public.gen_join_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result   text := '';
  i        int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- 1) Spalte zunächst nullable hinzufügen.
alter table public.classes add column join_code text;

-- 2) Bestehende Klassen mit eindeutigem Code backfillen.
do $$
declare
  rec record;
  candidate text;
begin
  for rec in select id from public.classes where join_code is null loop
    loop
      candidate := public.gen_join_code();
      exit when not exists (select 1 from public.classes where join_code = candidate);
    end loop;
    update public.classes set join_code = candidate where id = rec.id;
  end loop;
end;
$$;

-- 3) Jetzt not null + unique erzwingen.
alter table public.classes alter column join_code set not null;
alter table public.classes add constraint classes_join_code_unique unique (join_code);

create index classes_join_code_idx on public.classes (join_code);
