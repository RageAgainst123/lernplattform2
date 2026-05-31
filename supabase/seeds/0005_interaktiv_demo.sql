-- Seed: Interaktiv-Demo-Präsentation zum Testen ALLER Live-Block-Typen.
-- display_mode 'presentation'. Eine Folie pro Interaktionstyp + Begrüßung/Abschluss.
-- VORAUSSETZUNG: Migrationen 0008 (presentation), 0009 (live_sessions), 0010
-- (Per-Block-State + live_presence), 0011 (free_text + option_id nullable).
-- Idempotent: feste UUID, on conflict do nothing.

insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic,
  content, estimated_minutes, is_published, display_mode
)
values (
  '00000000-0000-4000-8000-00000001bde1',
  'Interaktiv-Demo — alle Live-Blocktypen',
  'Test-Präsentation für die neuen Interaktionstypen: live_poll, quiz_poll, word_cloud, scale, understanding.',
  5,
  'orientierung',
  'Interaktiv-Demo',
  $${
    "blocks": [
      {
        "id": "s1",
        "type": "slide",
        "title": "Willkommen zur Interaktiv-Demo",
        "body": "Wir testen heute alle neuen Live-Elemente. Schaut nach vorne!"
      },
      {
        "id": "p1",
        "type": "live_poll",
        "question": "Wie geht es euch heute?",
        "options": [
          { "id": "o1", "text": "Super" },
          { "id": "o2", "text": "Geht so" },
          { "id": "o3", "text": "Müde" }
        ]
      },
      {
        "id": "q1",
        "type": "quiz_poll",
        "question": "Welches ist ein Eingabegerät?",
        "options": [
          { "id": "q1a", "text": "Drucker", "correct": false },
          { "id": "q1b", "text": "Maus", "correct": true },
          { "id": "q1c", "text": "Lautsprecher", "correct": false },
          { "id": "q1d", "text": "Bildschirm", "correct": false }
        ]
      },
      {
        "id": "w1",
        "type": "word_cloud",
        "question": "Was fällt euch zum Thema Computer ein?"
      },
      {
        "id": "sc1",
        "type": "scale",
        "question": "Wie gut kennst du dich mit Computern aus?",
        "min": 1,
        "max": 5,
        "minLabel": "gar nicht",
        "maxLabel": "sehr gut"
      },
      {
        "id": "u1",
        "type": "understanding",
        "question": "Hast du alles verstanden?"
      },
      {
        "id": "s2",
        "type": "slide",
        "title": "Danke fürs Mitmachen!",
        "body": "Das war die Interaktiv-Demo. Eure Geräte sind gleich wieder frei."
      }
    ]
  }$$,
  10,
  true,
  'presentation'
)
on conflict (id) do nothing;

-- Der ersten Klasse zuweisen (gleich wie 0004_live_demo).
insert into public.class_modules (class_id, module_id)
select c.id, '00000000-0000-4000-8000-00000001bde1'
from public.classes c
order by c.created_at
limit 1
on conflict (class_id, module_id) do nothing;
