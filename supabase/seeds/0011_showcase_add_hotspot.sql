-- Seed-Update 0011: Showcase-Lernmodul um hotspot-Block erweitern (A3)
--
-- Das Showcase-Lernmodul bekommt einen neuen „Bild-Hotspots"-Block (hotspot) —
-- Schüler:innen tippen die richtigen Stellen im Bild an. Teilpunkte über
-- (richtig − falsch) / Anzahl-richtige; Falschklicks ziehen ab.
--
-- UPDATE statt INSERT, weil das Modul (feste UUID …c5e1ea7) bereits existiert.
-- Idempotent: mehrfaches Ausführen setzt denselben content erneut.
--
-- Bild-URL: feste Pexels-URL (Laptop/Arbeitsplatz, frei nutzbar). Stabil, damit
-- der Seed deterministisch bleibt. Im echten Autoren-Workflow ersetzt man sie
-- per Upload oder Pexels-Suche im Editor.
--
-- VORAUSSETZUNG: Migration 0024 (numeric scores) muss eingespielt sein.
--
-- STOP-PUNKT für Geo: Dieses Update im Supabase-Dashboard ausführen.

update public.modules
set content = $${
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
      "id": "categorize_einfach",
      "type": "categorize",
      "question": "Kategorien-Zuordnung: Sortiere die Geräte in die richtigen Behälter. (Du bekommst Teilpunkte!)",
      "buckets": [
        { "id": "b-ein", "label": "Eingabe" },
        { "id": "b-aus", "label": "Ausgabe" }
      ],
      "items": [
        { "id": "ci1", "text": "Tastatur", "bucketId": "b-ein" },
        { "id": "ci2", "text": "Maus", "bucketId": "b-ein" },
        { "id": "ci3", "text": "Mikrofon", "bucketId": "b-ein" },
        { "id": "ci4", "text": "Bildschirm", "bucketId": "b-aus" },
        { "id": "ci5", "text": "Drucker", "bucketId": "b-aus" },
        { "id": "ci6", "text": "Lautsprecher", "bucketId": "b-aus" }
      ],
      "hint": "Eingabe = du gibst dem Computer etwas. Ausgabe = der Computer gibt dir etwas zurück.",
      "maxAttempts": 2,
      "category": "uebung"
    },
    {
      "id": "mark_einfach",
      "type": "mark_words",
      "instruction": "Markieren im Text: Tippe alle Eingabegeräte an. (Du bekommst Teilpunkte!)",
      "text": "Mit der Tastatur und der Maus steuerst du den Computer. Der Bildschirm und der Drucker zeigen oder drucken das Ergebnis. Auch das Mikrofon nimmt deine Stimme auf.",
      "correctIndices": [2, 5, 22],
      "hint": "Eingabegeräte geben dem Computer etwas: Tastatur, Maus, Mikrofon.",
      "maxAttempts": 2,
      "category": "uebung"
    },
    {
      "id": "order_einfach",
      "type": "order",
      "instruction": "Reihenfolge: Bring die Schritte des EVA-Prinzips in die richtige Reihenfolge. (Teilpunkte!)",
      "items": [
        { "id": "oe1", "text": "Eingabe (z.B. Tastatur)" },
        { "id": "oe2", "text": "Verarbeitung (CPU)" },
        { "id": "oe3", "text": "Ausgabe (z.B. Bildschirm)" }
      ],
      "hint": "Denk an das Merkwort E – V – A.",
      "maxAttempts": 2,
      "category": "uebung"
    },
    {
      "id": "hotspot_einfach",
      "type": "hotspot",
      "instruction": "Bild-Hotspots: Tippe die beiden Eingabegeräte im Bild an. (Du bekommst Teilpunkte — Falschklicks ziehen ab!)",
      "imageUrl": "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg",
      "imageAlt": "Ein Arbeitsplatz mit Laptop, Tastatur und Maus",
      "areas": [
        { "id": "hs-tastatur", "label": "Tastatur", "x": 0.5, "y": 0.78, "r": 0.18, "isCorrect": true },
        { "id": "hs-maus", "label": "Maus", "x": 0.85, "y": 0.7, "r": 0.1, "isCorrect": true },
        { "id": "hs-bildschirm", "label": "Bildschirm", "x": 0.5, "y": 0.32, "r": 0.16, "isCorrect": false }
      ],
      "hint": "Eingabegeräte geben dem Computer etwas. Der Bildschirm zeigt nur etwas an.",
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
      "content": "Du hast jetzt alle Aufgaben-Typen kennengelernt, die in einem Lernmodul vorkommen können. Live-Polls, Wortwolken und Verständnis-Ampeln gibt es in der zugehörigen Präsentation »Showcase Live-Tools« — die zeigt dir deine Lehrerin am Beamer."
    }
  ]
}$$::jsonb
where id = '00000000-0000-4000-8000-00000c5e1ea7';
