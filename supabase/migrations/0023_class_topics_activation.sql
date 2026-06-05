-- Migration 0023: class_topics als Source of Truth aktivieren (Phase V)
--
-- Hintergrund: class_topics existiert seit Migration 0013, wurde aber nie
-- aktiv genutzt. Statt einem Topic eine Klasse zuzuweisen, hat
-- assignTopicToClass() ALLE published Module des Topics einzeln in
-- class_modules upgesertet. Folge: Neue Module eines Topics tauchen nicht
-- automatisch in der Klasse auf — Lehrer:in muss „neu zuweisen" klicken.
--
-- Phase V macht class_topics zur Source of Truth. Beim Lesen joinen wir
-- class_topics → modules (via topic_id). class_modules bleibt als
-- Override-Mechanismus (due_date, pass_threshold per Modul) bestehen und
-- als Fallback für Module ohne topic_id (Orphans).
--
-- Diese Migration ist additiv: KEIN Cleanup von class_modules. Bestehende
-- Zuweisungen funktionieren weiter — die UI vereinigt beide Quellen.
--
-- STOP-PUNKT für Geo: Diese Migration im Supabase-Dashboard ausführen.
-- Risiko: niedrig. Nur Indizes + ein optionales JSONB-Override. Falls die
-- Indizes schon existieren (aus 0013), passiert nichts.

-- Index für den häufigen Lese-Pfad: alle Topics einer Klasse.
-- (Existiert bereits aus 0013 als class_topics_class_idx — IF NOT EXISTS
-- macht den Re-Run idempotent.)
create index if not exists class_topics_class_idx
  on public.class_topics (class_id);

-- Reverse-Index für die Admin-Sicht „wer hat dieses Thema?".
create index if not exists class_topics_topic_idx
  on public.class_topics (topic_id);

-- Performance-Index für getAssignedTopicsForClass: lädt Topics einer
-- Klasse zusammen mit deren published Modulen sortiert. Modules-seitig
-- profitieren wir vom bestehenden modules_topic_id-Index (aus 0013).
-- Topics-seitig brauchen wir einen FK-Index, der schon existiert.

-- Sanity-Check (auskommentiert — aktivieren falls Migration verifiziert
-- werden soll):
-- SELECT indexname, tablename FROM pg_indexes
--  WHERE tablename = 'class_topics'
--  ORDER BY indexname;
