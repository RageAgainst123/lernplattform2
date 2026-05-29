-- Seed: Lern-Modul „Suchen im Internet" (5. Schulstufe, Bereich Information).
-- Lehrplan-Bezug: BGBl. II 267/2022, Teilkompetenzen 1.4 (T) + 1.6 (I).
-- Wird der Test-Klasse 5T NICHT automatisch zugewiesen — Zuweisung
-- passiert via /admin/material-Verknüpfung mit dem dazugehörigen PDF.
-- Idempotent: feste UUID, on conflict do nothing.

insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic,
  content, estimated_minutes, is_published, display_mode
)
values (
  '00000000-0000-4000-8000-00000000ad5e',
  'Suchen im Internet',
  'Wie finde ich, was ich wirklich brauche? Suchmaschinen kennen, Suchbegriffe formulieren, Treffer bewerten. (Lehrplan: 5. SSt., Information, K1.4 + K1.6)',
  5,
  'information',
  'Suchen im Internet',
  $${
    "blocks": [
      {
        "id": "b1",
        "type": "text",
        "content": "Wenn du etwas im Internet suchst, hilft dir eine Suchmaschine. Du tippst Stichwörter ein, und die Suchmaschine zeigt dir eine Liste mit Treffern. Aber Vorsicht: nicht jeder Treffer ist gleich gut — manche sind Werbung, manche stimmen nicht."
      },
      {
        "id": "b2",
        "type": "infobox",
        "title": "Merke",
        "content": "Eine Suchmaschine ist kein Browser. Firefox, Chrome und Safari sind Browser — Google, Ecosia oder fragFINN sind Suchmaschinen."
      },
      {
        "id": "b3",
        "type": "multiple_choice",
        "question": "Welche dieser Namen sind KEINE Suchmaschinen? (Mehrere möglich)",
        "options": [
          { "id": "o1", "text": "Firefox", "correct": true },
          { "id": "o2", "text": "Google", "correct": false },
          { "id": "o3", "text": "Safari", "correct": true },
          { "id": "o4", "text": "Ecosia", "correct": false }
        ],
        "feedbackCorrect": "Genau! Firefox und Safari sind Browser. Google und Ecosia sind Suchmaschinen.",
        "feedbackWrong": "Tipp: Firefox und Safari sind Programme, mit denen du ins Internet gehst — Browser. Suchmaschinen wie Google laufen IN diesen Browsern."
      },
      {
        "id": "b4",
        "type": "true_false",
        "question": "Der erste Treffer in einer Suche ist immer der beste.",
        "answer": false,
        "feedbackCorrect": "Stimmt! Oft ist der erste Treffer eine Anzeige (Werbung), oder es gibt bessere weiter unten.",
        "feedbackWrong": "Pass auf: ganz oben stehen oft Anzeigen. Vergleiche immer mehrere Treffer, bevor du dir eine Meinung bildest."
      },
      {
        "id": "b5",
        "type": "fill_blank",
        "text": "Wenn du suchst, tippst du am besten kurze {0} ein. Bei jedem Treffer solltest du prüfen, ob er aus einer guten {1} stammt.",
        "solutions": ["Stichwörter", "Quelle"],
        "distractors": ["Anzeige", "Verbindung"]
      },
      {
        "id": "b6",
        "type": "match",
        "question": "Ordne jede Suchmaschine ihrer Besonderheit zu.",
        "pairs": [
          { "id": "p1", "term": "fragFINN", "category": "Nur Kinderseiten" },
          { "id": "p2", "term": "Blinde Kuh", "category": "Nur Kinderseiten" },
          { "id": "p3", "term": "Ecosia", "category": "Pflanzt Bäume" },
          { "id": "p4", "term": "Google", "category": "Sammelt viele Daten" }
        ]
      },
      {
        "id": "b7",
        "type": "reflection",
        "prompt": "Stell dir vor, du hast ein Suchergebnis und bist dir nicht sicher, ob es wirklich stimmt. Was kannst du tun, um es zu überprüfen?",
        "placeholder": "Zum Beispiel: Ich schaue, wer den Text geschrieben hat …"
      }
    ]
  }$$,
  20,
  true,
  'worksheet'
)
on conflict (id) do nothing;
