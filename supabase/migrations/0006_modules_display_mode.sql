-- Migration 0006: Anzeige-Modus für Module (Quiz vs. Arbeitsblatt)
-- Schüler:innen sollen Module entweder als Quiz (Block-für-Block mit
-- Sofort-Feedback) oder als Arbeitsblatt (alle Aufgaben auf einer Seite,
-- ohne Sofort-Bewertung, definitiv abgeben) bearbeiten. Pro Modul
-- entscheidet die Admin im /admin-Editor den Modus.

alter table public.modules
  add column display_mode text not null default 'quiz'
  check (display_mode in ('quiz', 'worksheet'));

-- EVA-Modul sofort auf Arbeitsblatt umstellen — der ursprüngliche Anwendungsfall.
update public.modules
  set display_mode = 'worksheet'
  where title = 'Das EVA-Prinzip';
