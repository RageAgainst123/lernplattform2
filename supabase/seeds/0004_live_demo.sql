-- Seed: Live-Demo-Präsentation zum Testen der interaktiven Live-Polls.
-- display_mode 'presentation'. Mischung aus slide- und live_poll-Folien an
-- verschiedenen Stellen (2-, 3- und 4-Optionen-Polls), damit Dimm-Overlay und
-- Abstimmung + Beamer-Balken durchgetestet werden können.
-- VORAUSSETZUNG: Migrationen 0008 (presentation-Modus) + 0009 (live_sessions).
-- Idempotent: feste UUID, on conflict do nothing.

insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic,
  content, estimated_minutes, is_published, display_mode
)
values (
  '00000000-0000-4000-8000-00000001bde0',
  'Live-Demo — Abstimmen testen',
  'Test-Präsentation für die Live-Polls: durchklicken, Kinder stimmen am Gerät ab, Balken am Beamer.',
  5,
  'orientierung',
  'Live-Demo',
  $${
    "blocks": [
      {
        "id": "s1",
        "type": "slide",
        "title": "Willkommen zur Live-Demo",
        "body": "Schaut nach vorne — gleich dürft ihr abstimmen!"
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
        "id": "s2",
        "type": "slide",
        "title": "Gut gemacht!",
        "body": "So funktioniert eine Live-Abstimmung. Jetzt eine Wahr/Falsch-Frage."
      },
      {
        "id": "p2",
        "type": "live_poll",
        "question": "Ist eine Maus ein Eingabegerät?",
        "options": [
          { "id": "ja", "text": "Ja" },
          { "id": "nein", "text": "Nein" }
        ]
      },
      {
        "id": "s3",
        "type": "slide",
        "title": "Letzte Frage",
        "body": "Stimmt ab — wir schauen uns das Ergebnis gemeinsam an."
      },
      {
        "id": "p3",
        "type": "live_poll",
        "question": "Welches Gerät benutzt du am liebsten?",
        "options": [
          { "id": "a", "text": "Laptop" },
          { "id": "b", "text": "Tablet" },
          { "id": "c", "text": "Handy" },
          { "id": "d", "text": "Desktop-PC" }
        ]
      },
      {
        "id": "s4",
        "type": "slide",
        "title": "Danke fürs Mitmachen!",
        "body": "Das war die Live-Demo. Eure Geräte sind gleich wieder frei."
      }
    ]
  }$$,
  10,
  true,
  'presentation'
)
on conflict (id) do nothing;

-- Der ersten Klasse zuweisen (anpassen, falls du eine bestimmte Klasse willst).
insert into public.class_modules (class_id, module_id)
select c.id, '00000000-0000-4000-8000-00000001bde0'
from public.classes c
order by c.created_at
limit 1
on conflict (class_id, module_id) do nothing;
