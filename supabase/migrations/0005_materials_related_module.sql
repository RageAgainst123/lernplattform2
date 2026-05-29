-- Migration 0005: Material ↔ Modul-Verknüpfung
-- Materialien (PDFs) und Module (interaktive Aufgaben) waren bisher nur über
-- gemeinsames `topic` lose verbunden. Mit dieser Spalte wird die Verknüpfung
-- explizit: eingeloggte Schüler:innen sehen auf der Material-Seite einen
-- „Online ausfüllen"-Button, der direkt das verknüpfte Modul startet.
-- Lehrer:innen sehen die Ergebnisse im Klassen-Dashboard (eigene Phase).

alter table public.materials
  add column related_module_id uuid references public.modules(id) on delete set null;

create index materials_related_module_id_idx on public.materials (related_module_id);
