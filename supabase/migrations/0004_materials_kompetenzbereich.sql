-- Migration 0004: kompetenzbereich-Spalte für materials
-- Die öffentliche Navigation gliedert Materialien (wie Module) nach
-- Schulstufe → Kompetenzbereich → Thema. Das Feld fehlte in materials
-- (nur modules hatte es), wird hier nachgezogen.

alter table public.materials
  add column kompetenzbereich public.kompetenzbereich;

create index materials_kompetenzbereich_idx on public.materials (kompetenzbereich);
