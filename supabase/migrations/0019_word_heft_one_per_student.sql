-- Migration 0019: Modell-Wechsel — EIN Word-Heft pro Schüler:in (Phase Q-Fix).
--
-- Ursprünglich (0018) war ein Heft pro (student_code_id, topic_id) gedacht.
-- Pädagogische Entscheidung von Geo: das soll EIN generelles Schulübungsheft
-- sein, das in allen Themen-Lernpfaden als zusätzliches Werkzeug dient.
-- Schüler:in legt EINMAL ein Heft im OneDrive an, kann es überall öffnen.
--
-- Daher:
--   - topic_id wird aus dem unique-index entfernt
--   - neue unique-constraint: student_code_id ALONE (jeder kann nur EIN Heft)
--   - bestehende Daten: falls eine Schüler:in mehrere Hefte hat, wird das
--     zuletzt erstellte behalten (DELETE der älteren)
--
-- Außerdem Fix für Bug aus 0018: der partial unique-index taugt nicht für
-- ON CONFLICT in Postgres (kein "real" constraint). Wir brauchen einen
-- echten unique-constraint, kein partial-index.

-- Schritt 1: Bei Bestand mit mehreren Heften pro Schüler:in das neueste
-- behalten, ältere löschen.
delete from public.word_heft_links a
  using public.word_heft_links b
 where a.student_code_id = b.student_code_id
   and a.created_at < b.created_at;

-- Schritt 2: Alten partial-Index entfernen (war: WHERE topic_id IS NOT NULL)
drop index if exists public.word_heft_links_student_topic_idx;

-- Schritt 3: topic_id auf NULL setzen — das Heft gehört keinem Thema mehr,
-- es ist ein generelles Schulübungsheft.
update public.word_heft_links set topic_id = null;

-- Schritt 4: echte unique-constraint auf student_code_id allein
alter table public.word_heft_links
  add constraint word_heft_links_student_unique
  unique (student_code_id);
