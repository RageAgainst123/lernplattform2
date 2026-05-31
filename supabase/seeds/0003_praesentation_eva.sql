-- Seed: Einstiegs-Präsentation „EVA-Prinzip" (5. Schulstufe, Orientierung).
-- display_mode 'presentation' (geführte Folien am Beamer, Stundeneinstieg zur
-- gemeinsamen Erarbeitung). Nur slide-Blöcke → kein Scoring (max_score = 0).
-- Referenz-Beispiel für docs/THEMA-WORKFLOW.md §6.
-- VORAUSSETZUNG: Migration 0008 muss eingespielt sein (display_mode-CHECK).
-- Idempotent: feste UUID, on conflict do nothing.

insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic,
  content, estimated_minutes, is_published, display_mode
)
values (
  '00000000-0000-4000-8000-0000000e7a5e',
  'EVA-Prinzip — Einstieg (Präsentation)',
  'Geführter Stundeneinstieg zum EVA-Prinzip: gemeinsam erarbeiten, was ein Computer tut.',
  5,
  'orientierung',
  'EVA-Prinzip',
  $${
    "blocks": [
      {
        "id": "s1",
        "type": "slide",
        "title": "Was macht ein Computer eigentlich?",
        "body": "Überlegt kurz: Was passiert, wenn ihr eine Taste drückt?"
      },
      {
        "id": "s2",
        "type": "slide",
        "title": "Drei Schritte: E – V – A",
        "body": "Eingabe → Verarbeitung → Ausgabe.\nFast jedes Gerät folgt diesem Ablauf."
      },
      {
        "id": "s3",
        "type": "slide",
        "title": "Eingabe",
        "body": "Wir geben dem Computer Daten — z. B. mit Tastatur, Maus oder Mikrofon."
      },
      {
        "id": "s4",
        "type": "slide",
        "title": "Verarbeitung",
        "body": "Der Computer rechnet und verarbeitet die Daten im Inneren."
      },
      {
        "id": "s5",
        "type": "slide",
        "title": "Ausgabe",
        "body": "Das Ergebnis kommt heraus — z. B. am Bildschirm, Drucker oder Lautsprecher."
      },
      {
        "id": "p1",
        "type": "live_poll",
        "question": "Ist eine Tastatur Eingabe oder Ausgabe?",
        "options": [
          { "id": "ein", "text": "Eingabe" },
          { "id": "aus", "text": "Ausgabe" },
          { "id": "beides", "text": "Beides" }
        ]
      },
      {
        "id": "s6",
        "type": "slide",
        "title": "Jetzt seid ihr dran",
        "body": "Findet zu zweit drei Geräte und ordnet zu: Was ist Eingabe, was Ausgabe?"
      }
    ]
  }$$,
  10,
  true,
  'presentation'
)
on conflict (id) do nothing;

-- Der ersten Klasse zuweisen (passt das an deine Klasse an, falls du mehrere hast).
insert into public.class_modules (class_id, module_id)
select c.id, '00000000-0000-4000-8000-0000000e7a5e'
from public.classes c
order by c.created_at
limit 1
on conflict (class_id, module_id) do nothing;
