-- Seed: Demo-Modul „EVA-Prinzip" (5. Schulstufe) mit allen 7 Phase-1-Block-Typen.
-- Wird der ersten Klasse der ersten Lehrer:in zugewiesen und veröffentlicht.
-- Idempotent: nutzt feste UUID, on conflict do nothing.

insert into public.modules (id, title, description, schulstufe, kompetenzbereich, topic, content, estimated_minutes, is_published)
values (
  '00000000-0000-4000-8000-000000000eva',
  'Das EVA-Prinzip',
  'Wie ein Computer arbeitet: Eingabe, Verarbeitung, Ausgabe.',
  5,
  'orientierung',
  'EVA-Prinzip',
  '{
    "blocks": [
      {
        "id": "b1",
        "type": "text",
        "content": "Ein Computer arbeitet immer nach dem gleichen Prinzip: Er bekommt Daten (Eingabe), verarbeitet sie und gibt ein Ergebnis aus (Ausgabe). Das nennt man das EVA-Prinzip: Eingabe – Verarbeitung – Ausgabe."
      },
      {
        "id": "b2",
        "type": "infobox",
        "title": "Merke",
        "content": "EVA steht für Eingabe, Verarbeitung und Ausgabe. Fast jedes Gerät folgt diesem Ablauf."
      },
      {
        "id": "b3",
        "type": "multiple_choice",
        "question": "Welche dieser Geräte sind Eingabegeräte? (Mehrere möglich)",
        "options": [
          { "id": "o1", "text": "Tastatur", "correct": true },
          { "id": "o2", "text": "Drucker", "correct": false },
          { "id": "o3", "text": "Maus", "correct": true },
          { "id": "o4", "text": "Bildschirm", "correct": false }
        ],
        "feedbackCorrect": "Genau! Mit Tastatur und Maus gibst du Daten in den Computer ein.",
        "feedbackWrong": "Drucker und Bildschirm geben etwas aus – sie sind Ausgabegeräte."
      },
      {
        "id": "b4",
        "type": "true_false",
        "question": "Ein Lautsprecher ist ein Eingabegerät.",
        "answer": false,
        "feedbackCorrect": "Richtig! Ein Lautsprecher gibt Töne aus – er ist ein Ausgabegerät.",
        "feedbackWrong": "Ein Lautsprecher gibt Töne aus. Er ist ein Ausgabegerät."
      },
      {
        "id": "b5",
        "type": "fill_blank",
        "text": "Beim EVA-Prinzip kommt zuerst die {0}, dann die Verarbeitung und zuletzt die {1}.",
        "solutions": ["Eingabe", "Ausgabe"],
        "distractors": ["Speicherung", "Verbindung"]
      },
      {
        "id": "b6",
        "type": "match",
        "question": "Ordne jedes Gerät richtig zu.",
        "pairs": [
          { "id": "p1", "term": "Tastatur", "category": "Eingabe" },
          { "id": "p2", "term": "Mikrofon", "category": "Eingabe" },
          { "id": "p3", "term": "Drucker", "category": "Ausgabe" },
          { "id": "p4", "term": "Bildschirm", "category": "Ausgabe" }
        ]
      },
      {
        "id": "b7",
        "type": "reflection",
        "prompt": "Nenne ein Gerät aus deinem Alltag und überlege: Was ist dort die Eingabe und was die Ausgabe?",
        "placeholder": "Zum Beispiel: Mein Taschenrechner …"
      }
    ]
  }'::jsonb,
  15,
  true
)
on conflict (id) do nothing;

-- Modul der ersten Klasse zuweisen (passt das Beispiel an deine Klasse an,
-- falls du mehrere hast).
insert into public.class_modules (class_id, module_id)
select c.id, '00000000-0000-4000-8000-000000000eva'
from public.classes c
order by c.created_at
limit 1
on conflict (class_id, module_id) do nothing;
