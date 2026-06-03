-- Seed: Test-Quiz „EVA-Quiz" — eigenständiges activity_kind='quiz'-Modul.
--
-- Zweck: damit Geo die Sprint-R-Verbesserungen (Score-Hero, Wrong-Only,
-- Tippfehlertoleranz, Solo-Punkte) UND später das Live-Klassen-Quiz
-- (Phase S, sobald die UI fertig ist) am selben Modul testen kann.
--
-- Block-Typen sind bewusst nur MC + T/F + Lückentext — das sind die
-- Live-Quiz-tauglichen Typen (Spec §3.9). Match bleibt Solo-only.
--
-- Idempotent: feste UUID, on conflict do nothing. Wird NICHT automatisch
-- einer Klasse zugewiesen — Geo macht das per Lehrer:innen-UI
-- (/lehrer/klassen/[id] → Modul zuweisen) oder via SQL unten (auskommentiert).

insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic, content,
  estimated_minutes, is_published, activity_kind, display_mode
)
values (
  '00000000-0000-4000-8000-00000000eva1',
  'EVA-Quiz',
  'Teste dein Wissen zum EVA-Prinzip — 5 Fragen, kommt aus dem Lernmodul.',
  5,
  'orientierung',
  'EVA-Prinzip',
  '{
    "blocks": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "Wofür steht E-V-A?",
        "options": [
          { "id": "o1", "text": "Eingabe – Verarbeitung – Ausgabe", "correct": true },
          { "id": "o2", "text": "Erkennen – Verstehen – Anwenden", "correct": false },
          { "id": "o3", "text": "Einschalten – Verbinden – Abschalten", "correct": false },
          { "id": "o4", "text": "Eingabe – Verbindung – Antwort", "correct": false }
        ],
        "feedbackCorrect": "Genau! E steht für Eingabe, V für Verarbeitung, A für Ausgabe.",
        "feedbackWrong": "EVA steht für Eingabe – Verarbeitung – Ausgabe."
      },
      {
        "id": "q2",
        "type": "true_false",
        "question": "Ein Mikrofon ist ein Eingabegerät.",
        "answer": true,
        "feedbackCorrect": "Stimmt! Ein Mikrofon nimmt Töne auf und schickt sie in den Computer.",
        "feedbackWrong": "Doch! Ein Mikrofon liefert Töne als Eingabe — es ist ein Eingabegerät."
      },
      {
        "id": "q3",
        "type": "multiple_choice",
        "question": "Welche dieser Geräte sind Ausgabegeräte? (mehrere möglich)",
        "options": [
          { "id": "o1", "text": "Bildschirm", "correct": true },
          { "id": "o2", "text": "Tastatur", "correct": false },
          { "id": "o3", "text": "Drucker", "correct": true },
          { "id": "o4", "text": "Lautsprecher", "correct": true },
          { "id": "o5", "text": "Webcam", "correct": false }
        ],
        "feedbackCorrect": "Richtig! Bildschirm, Drucker und Lautsprecher geben Daten aus.",
        "feedbackWrong": "Bildschirm, Drucker und Lautsprecher sind Ausgabegeräte — Tastatur und Webcam sind Eingabegeräte."
      },
      {
        "id": "q4",
        "type": "fill_blank",
        "text": "Beim EVA-Prinzip ist die {0} der Mittelteil zwischen Eingabe und Ausgabe.",
        "solutions": ["Verarbeitung"],
        "distractors": ["Speicherung", "Übertragung", "Berechnung"]
      },
      {
        "id": "q5",
        "type": "true_false",
        "question": "Eine Festplatte ist sowohl Eingabe- als auch Ausgabegerät.",
        "answer": true,
        "feedbackCorrect": "Genau! Sie speichert Daten (Eingabe) und gibt sie wieder aus (Ausgabe).",
        "feedbackWrong": "Doch! Eine Festplatte nimmt Daten auf UND gibt sie wieder aus — sie kann beides."
      }
    ]
  }'::jsonb,
  10,
  true,
  'quiz',
  'quiz'
)
on conflict (id) do nothing;

-- Auto-Zuweisung an die erste Klasse — auskommentiert, damit Geo bewusst
-- per UI zuweist (so testet sie gleich auch den Zuweisungs-Flow). Falls
-- doch sofort zuweisen gewünscht: die folgenden 5 Zeilen entkommentieren.
--
-- insert into public.class_modules (class_id, module_id)
-- select c.id, '00000000-0000-4000-8000-00000000eva1'
-- from public.classes c
-- order by c.created_at
-- limit 1
-- on conflict (class_id, module_id) do nothing;
