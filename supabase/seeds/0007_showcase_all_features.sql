-- Seed: Showcase-Topic + zwei Demo-Module (Phase W, 2026-06-05)
--
-- Zeigt ALLE Block-Typen + ALLE Phase-W-Features in einem zusammen-
-- hängenden Lehr-Beispiel:
--
--   1. Topic „Plattform-Showcase" (6. Schulstufe, orientierung)
--   2. Lernmodul „Showcase Lernmodul" (display_mode='worksheet') —
--      12 Blöcke: text, infobox, multiple_choice (×2: einfach + Phase-W),
--      true_false (×2), fill_blank (×2), match (×2), reflection, outro.
--      Phase-W-Features (hint, maxAttempts=2/3, category) auf den
--      „mit_hint"-Varianten jedes graded Block-Typs.
--   3. Präsentation „Showcase Live-Tools" (display_mode='presentation') —
--      8 Blöcke: 3 slides + live_poll + quiz_poll + word_cloud + scale
--      + understanding. Lehrer:in startet das am Beamer.
--
-- Zuweisung an die erste Klasse erfolgt über class_topics (Phase V — Source
-- of Truth). Neue Module dieses Topics tauchen damit automatisch im
-- Schüler:innen-Lernpfad auf.
--
-- VORAUSSETZUNGEN:
--   • Migration 0013 (topics + class_topics) eingespielt
--   • Migration 0023 (class_topics_activation Indizes) eingespielt
--   • Mindestens 1 Klasse existiert (sonst keine Zuweisung — Module
--     bleiben in der Datenbank, sind aber niemandem zugeordnet).
--
-- Idempotent: feste UUIDs, on conflict do nothing.

-- ─── 1) Topic „Plattform-Showcase" ──────────────────────────────────────
insert into public.topics (
  id, slug, label, description, schulstufe, kompetenzbereich,
  is_published, sort_order
)
values (
  '00000000-0000-4000-8000-00000000c5e0',
  'plattform-showcase',
  'Plattform-Showcase: Alle Features im Überblick',
  'Beispiel-Thema, das jeden Block-Typ und jedes didaktische Feature der Plattform zeigt — vom einfachen Lesetext bis zur Live-Wortwolke. Gedacht als Tour für neue Lehrer:innen und als Spielwiese zum Ausprobieren.',
  6,
  'orientierung',
  true,
  99
)
on conflict (id) do nothing;

-- ─── 2) Lernmodul „Showcase Lernmodul" ──────────────────────────────────
insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic, topic_id,
  activity_kind, display_mode, content, estimated_minutes, is_published,
  sort_order
)
values (
  '00000000-0000-4000-8000-00000c5e1ea7',
  'Showcase Lernmodul — alle Aufgaben-Typen',
  'Klick dich durch und lerne kennen: Text, Infobox, Multiple-Choice (einfach + mit Hinweis), Wahr/Falsch, Lückentext, Match, Reflexion. Bei einigen Aufgaben darfst du mehrmals probieren und siehst einen Hinweis.',
  6,
  'orientierung',
  'Plattform-Showcase',
  '00000000-0000-4000-8000-00000000c5e0',
  'lernmodul',
  'worksheet',
  $${
    "blocks": [
      {
        "id": "intro",
        "type": "text",
        "content": "Willkommen im Showcase-Modul! Du siehst hier alle Bausteine, die ein Lernmodul auf dieser Plattform haben kann. Jeder Baustein zeigt eine Funktion — von einfachem Lesetext bis zu Mehrfachversuch-Fragen mit Hinweisen.",
        "category": "theorie"
      },
      {
        "id": "merksatz",
        "type": "infobox",
        "title": "So funktioniert ein Lernmodul",
        "content": "Du klickst dich Schritt für Schritt durch die Aufgaben. Bei den Übungen kannst du oben deine Antwort wählen, dann auf »Prüfen« tippen. Bei manchen Fragen darfst du es mehrmals versuchen — dann hilft dir ein Hinweis weiter.",
        "category": "theorie"
      },
      {
        "id": "mc_einfach",
        "type": "multiple_choice",
        "question": "Multiple-Choice (1 Versuch, mehrere Antworten richtig): Welche Geräte sind Eingabegeräte?",
        "options": [
          { "id": "o1", "text": "Tastatur", "correct": true },
          { "id": "o2", "text": "Drucker", "correct": false },
          { "id": "o3", "text": "Mikrofon", "correct": true },
          { "id": "o4", "text": "Bildschirm", "correct": false }
        ],
        "feedbackCorrect": "Genau — mit Tastatur und Mikrofon gibst du Daten ein.",
        "feedbackWrong": "Drucker und Bildschirm geben etwas aus.",
        "category": "uebung"
      },
      {
        "id": "mc_mit_hint",
        "type": "multiple_choice",
        "question": "Multiple-Choice (3 Versuche, mit Hinweis): Welche der folgenden Aussagen über das EVA-Prinzip stimmt?",
        "options": [
          { "id": "a", "text": "EVA steht für Eingabe – Verarbeitung – Ausgabe.", "correct": true },
          { "id": "b", "text": "EVA ist der Name des Programms im Computer.", "correct": false },
          { "id": "c", "text": "EVA-Geräte arbeiten nur am Bildschirm.", "correct": false }
        ],
        "feedbackCorrect": "Stimmt! E – V – A: Eingabe, Verarbeitung, Ausgabe.",
        "feedbackWrong": "Nicht ganz. Schau dir den Hinweis an.",
        "hint": "EVA ist ein Merkwort aus drei Anfangsbuchstaben. Was passiert beim Computer in dieser Reihenfolge?",
        "maxAttempts": 3,
        "category": "uebung"
      },
      {
        "id": "tf_einfach",
        "type": "true_false",
        "question": "Wahr/Falsch (1 Versuch): Ein Lautsprecher ist ein Eingabegerät.",
        "answer": false,
        "feedbackCorrect": "Richtig — ein Lautsprecher gibt Töne aus, er ist ein Ausgabegerät.",
        "feedbackWrong": "Lautsprecher geben Töne aus, sie sind Ausgabegeräte.",
        "category": "uebung"
      },
      {
        "id": "tf_mit_hint",
        "type": "true_false",
        "question": "Wahr/Falsch (2 Versuche, mit Hinweis): Eine Festplatte gehört zur »Verarbeitung« im EVA-Prinzip.",
        "answer": false,
        "feedbackCorrect": "Korrekt — Festplatten speichern Daten, das ist ein eigener Bereich (Speicherung), nicht Verarbeitung.",
        "feedbackWrong": "Festplatten speichern Daten dauerhaft. Verarbeitung passiert woanders.",
        "hint": "Verarbeitung ist die Aufgabe des Prozessors (CPU). Die Festplatte hat einen anderen Job.",
        "maxAttempts": 2,
        "category": "uebung"
      },
      {
        "id": "fill_einfach",
        "type": "fill_blank",
        "text": "Beim EVA-Prinzip kommt zuerst die {0}, dann die Verarbeitung, und zuletzt die {1}.",
        "solutions": ["Eingabe", "Ausgabe"],
        "distractors": ["Anzeige", "Speicherung"],
        "category": "uebung"
      },
      {
        "id": "fill_mit_hint",
        "type": "fill_blank",
        "text": "Die wichtigsten drei Hardware-Komponenten im Computer sind: {0}, Arbeitsspeicher und {1}.",
        "solutions": ["Prozessor", "Festplatte"],
        "distractors": ["Tastatur", "Bildschirm", "Maus"],
        "hint": "Denke an die Bauteile, die im Inneren des Computers sitzen und nicht von außen sichtbar sind.",
        "maxAttempts": 3,
        "strict": false,
        "category": "uebung"
      },
      {
        "id": "match_einfach",
        "type": "match",
        "question": "Match-Aufgabe: Ordne die Geräte ihrer Aufgabe zu.",
        "pairs": [
          { "id": "p1", "term": "Tastatur", "category": "Eingabe" },
          { "id": "p2", "term": "Mikrofon", "category": "Eingabe" },
          { "id": "p3", "term": "Bildschirm", "category": "Ausgabe" },
          { "id": "p4", "term": "Drucker", "category": "Ausgabe" }
        ],
        "category": "uebung"
      },
      {
        "id": "match_mit_hint",
        "type": "match",
        "question": "Match-Aufgabe (2 Versuche, mit Hinweis): Ordne die Bauteile ihrer Funktion zu.",
        "pairs": [
          { "id": "m1", "term": "CPU", "category": "Verarbeitung" },
          { "id": "m2", "term": "Festplatte", "category": "Speicherung" },
          { "id": "m3", "term": "RAM", "category": "Arbeitsspeicher" },
          { "id": "m4", "term": "Webcam", "category": "Eingabe" },
          { "id": "m5", "term": "Beamer", "category": "Ausgabe" }
        ],
        "hint": "CPU = Central Processing Unit. RAM steht für »Random Access Memory« — Daten, die der Computer gerade braucht.",
        "maxAttempts": 2,
        "category": "uebung"
      },
      {
        "id": "reflection",
        "type": "reflection",
        "prompt": "Schreibe in eigenen Worten: Welches Gerät benutzt du am häufigsten — und gehört es zur Eingabe, Verarbeitung oder Ausgabe? Erkläre kurz.",
        "placeholder": "Mein Gerät ist … weil …",
        "category": "reflexion"
      },
      {
        "id": "outro",
        "type": "infobox",
        "title": "Geschafft!",
        "content": "Du hast jetzt alle Aufgaben-Typen kennengelernt, die in einem Lernmodul vorkommen können. Live-Polls, Wortwolken und Verständnis-Ampeln gibt es in der zugehörigen Präsentation »Showcase Live-Tools« — die zeigt dir deine Lehrerin am Beamer.",
        "category": "theorie"
      }
    ]
  }$$::jsonb,
  20,
  true,
  1
)
on conflict (id) do nothing;

-- ─── 3) Präsentation „Showcase Live-Tools" ──────────────────────────────
insert into public.modules (
  id, title, description, schulstufe, kompetenzbereich, topic, topic_id,
  activity_kind, display_mode, content, estimated_minutes, is_published,
  sort_order
)
values (
  '00000000-0000-4000-8000-00000c5e2117',
  'Showcase Live-Tools — alle Beamer-Bausteine',
  'Geführte Präsentation am Beamer mit allen interaktiven Live-Bausteinen: Folien, Live-Poll (Meinung), Quiz-Poll (mit Lösung), Wortwolke, 1–5-Skala und Verständnis-Ampel.',
  6,
  'orientierung',
  'Plattform-Showcase',
  '00000000-0000-4000-8000-00000000c5e0',
  'praesentation',
  'presentation',
  $${
    "blocks": [
      {
        "id": "s_intro",
        "type": "slide",
        "title": "Showcase Live-Tools",
        "body": "Diese Präsentation zeigt alle interaktiven Bausteine, die du als Lehrer:in am Beamer einsetzen kannst — von Live-Abstimmungen bis zur Verständnis-Ampel."
      },
      {
        "id": "s_anleitung",
        "type": "slide",
        "title": "Wie es funktioniert",
        "body": "Schüler:innen melden sich mit ihrem Code an und sehen auf ihrem Handy/Tablet jeweils das Eingabe-Element zur aktuellen Folie. Du wechselst die Folien — die Live-Daten erscheinen am Beamer."
      },
      {
        "id": "live_poll_meinung",
        "type": "live_poll",
        "question": "Live-Poll (Meinungsbild — keine richtige Antwort): Welches Gerät benutzt du zu Hause am häufigsten?",
        "options": [
          { "id": "p1", "text": "Smartphone" },
          { "id": "p2", "text": "Laptop / PC" },
          { "id": "p3", "text": "Tablet" },
          { "id": "p4", "text": "Spielkonsole" }
        ]
      },
      {
        "id": "quiz_poll_wissen",
        "type": "quiz_poll",
        "question": "Quiz-Poll (mit richtiger Antwort — Auflösung am Beamer): Welches dieser Geräte ist KEIN Eingabegerät?",
        "options": [
          { "id": "q1", "text": "Maus", "correct": false },
          { "id": "q2", "text": "Drucker", "correct": true },
          { "id": "q3", "text": "Tastatur", "correct": false },
          { "id": "q4", "text": "Webcam", "correct": false }
        ]
      },
      {
        "id": "word_cloud_assoziation",
        "type": "word_cloud",
        "question": "Wortwolke: Nenne ein Gerät, das du selber besitzt und das mit einem Computer kommuniziert."
      },
      {
        "id": "scale_schwierigkeit",
        "type": "scale",
        "question": "Skala 1–5: Wie schwer fielen dir die Aufgaben im Lernmodul?",
        "min": 1,
        "max": 5,
        "minLabel": "ganz leicht",
        "maxLabel": "sehr schwer"
      },
      {
        "id": "understanding_ampel",
        "type": "understanding",
        "question": "Verständnis-Ampel: Wie sicher fühlst du dich beim EVA-Prinzip?"
      },
      {
        "id": "s_outro",
        "type": "slide",
        "title": "Vielen Dank!",
        "body": "Damit hast du alle Live-Bausteine kennengelernt. Im Lernmodul »Showcase Lernmodul« kannst du jetzt allein durchklicken und alle Aufgaben-Typen ausprobieren."
      }
    ]
  }$$::jsonb,
  15,
  true,
  2
)
on conflict (id) do nothing;

-- ─── 4) Topic der ersten Klasse zuweisen (Phase V: class_topics) ────────
-- Schreibt EINEN Eintrag in class_topics. Dank Phase V werden automatisch
-- beide oben angelegten Module dieses Topics im Lehrer- und Schüler-Pfad
-- sichtbar — und auch alle weiteren Module, die später mit topic_id =
-- 'c5e0…' angelegt werden.
insert into public.class_topics (class_id, topic_id)
select c.id, '00000000-0000-4000-8000-00000000c5e0'
from public.classes c
order by c.created_at
limit 1
on conflict (class_id, topic_id) do nothing;

-- ─── Sanity-Checks (auskommentiert; aktivieren zum Verifizieren) ────────
-- SELECT id, title, activity_kind, display_mode, is_published, topic_id
--   FROM public.modules
--  WHERE topic_id = '00000000-0000-4000-8000-00000000c5e0';
--
-- SELECT class_id, topic_id, assigned_at
--   FROM public.class_topics
--  WHERE topic_id = '00000000-0000-4000-8000-00000000c5e0';
