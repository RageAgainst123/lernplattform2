import type { BlockDoc } from './block-docs-types.ts';

// Doku-Registry: klassische Arbeitsblatt-Aufgaben mit Auto-Bewertung
// (multiple_choice, true_false, fill_blank, match, categorize, mark_words,
// order). Siehe block-docs.ts für den Gesamt-Kontext.

export const QUIZ_DOCS: Record<string, BlockDoc> = {
  multiple_choice: {
    type: 'multiple_choice',
    group: 'worksheet',
    graded: 'binary',
    aiHints: [
      'Mindestens 2 Optionen, davon mindestens EINE mit correct:true.',
      'Mehrere correct:true sind erlaubt (Mehrfachauswahl) — Schüler:in muss dann ALLE treffen.',
      'feedbackWrong sollte eine typische Falschvorstellung ansprechen.',
    ],
    answerFormat: 'string[] — die gewählten option-ids.',
    example: {
      id: 'mc1',
      type: 'multiple_choice',
      question: 'Welche Angaben sind persönliche Daten?',
      options: [
        { id: 'o1', text: 'Deine Wohnadresse', correct: true },
        { id: 'o2', text: 'Die Hauptstadt von Österreich', correct: false },
        { id: 'o3', text: 'Dein Geburtsdatum', correct: true },
      ],
      feedbackWrong: 'Allgemeinwissen wie Hauptstädte ist nicht „persönlich".',
    },
  },
  true_false: {
    type: 'true_false',
    group: 'worksheet',
    graded: 'binary',
    aiHints: [
      'answer ist ein boolean (true = Aussage stimmt).',
      'Aussage eindeutig formulieren — keine „manchmal/oft"-Grauzonen.',
    ],
    answerFormat: 'boolean — true oder false.',
    example: {
      id: 'tf1',
      type: 'true_false',
      question: 'Eine Suchmaschine speichert das ganze Internet auf deinem Gerät.',
      answer: false,
      feedbackWrong: 'Sie durchsucht einen Index auf fremden Servern, nicht dein Gerät.',
    },
  },
  fill_blank: {
    type: 'fill_blank',
    group: 'worksheet',
    graded: 'binary',
    aiHints: [
      'Anzahl der Platzhalter {0} {1} … im Text MUSS exakt der Anzahl solutions entsprechen.',
      'Platzhalter durchnummerieren ab {0}; solutions in derselben Reihenfolge.',
      'distractors (optional) sind Zusatz-Wörter für den Wortpool.',
      'Tippfehler werden tolerant geprüft; strict:true erzwingt exakte Schreibweise (Fachbegriffe).',
    ],
    answerFormat: '(string|null)[] — Wörter in Platzhalter-Reihenfolge.',
    example: {
      id: 'fb1',
      type: 'fill_blank',
      text: 'Eine {0} findet Webseiten und sortiert sie nach {1}.',
      solutions: ['Suchmaschine', 'Relevanz'],
      distractors: ['Tastatur'],
    },
  },
  match: {
    type: 'match',
    group: 'worksheet',
    graded: 'binary',
    aiHints: [
      'Mindestens 2 Paare; mindestens 2 UNTERSCHIEDLICHE category-Werte (sonst trivial).',
      'category ist der Text der Kategorie (kein id-Verweis) — gleiche Schreibweise konsistent halten.',
    ],
    answerFormat: 'Record<pairId, category> — jedem Begriff seine Kategorie.',
    example: {
      id: 'm1',
      type: 'match',
      question: 'Ordne zu: Eingabe oder Ausgabe?',
      pairs: [
        { id: 'p1', term: 'Tastatur', category: 'Eingabe' },
        { id: 'p2', term: 'Bildschirm', category: 'Ausgabe' },
        { id: 'p3', term: 'Maus', category: 'Eingabe' },
      ],
    },
  },
  categorize: {
    type: 'categorize',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      '2–4 buckets (benannte Behälter mit id+label) und ≥2 items.',
      'Jedes item.bucketId MUSS auf eine existierende bucket.id zeigen (= die richtige Lösung).',
      'Teilpunkte: Anteil korrekt einsortierter items.',
    ],
    answerFormat: 'Record<itemId, bucketId> — jedes item in seinen Behälter.',
    example: {
      id: 'cat1',
      type: 'categorize',
      question: 'Sortiere die Geräte nach EVA.',
      buckets: [
        { id: 'e', label: 'Eingabe' },
        { id: 'a', label: 'Ausgabe' },
      ],
      items: [
        { id: 'i1', text: 'Mikrofon', bucketId: 'e' },
        { id: 'i2', text: 'Lautsprecher', bucketId: 'a' },
        { id: 'i3', text: 'Webcam', bucketId: 'e' },
      ],
    },
  },
  mark_words: {
    type: 'mark_words',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'correctIndices sind 0-basierte WORT-Indizes (nur Wörter zählen, Satzzeichen nicht).',
      'Zähle die Wörter im text von 0 an, um die richtigen Indizes zu bestimmen.',
      'Teilpunkte: richtig markiert minus falsch markiert — Überschuss kostet Punkte.',
    ],
    answerFormat: 'number[] — die markierten Wort-Indizes.',
    // "Tim"(0) "wohnt"(1) "in"(2) "der"(3) "Mozartgasse"(4) "5"(5) "in"(6) "Wien"(7)
    example: {
      id: 'mw1',
      type: 'mark_words',
      instruction: 'Markiere alle persönlichen Daten.',
      text: 'Tim wohnt in der Mozartgasse 5 in Wien.',
      correctIndices: [0, 4, 5, 7],
    },
  },
  order: {
    type: 'order',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'items in der KORREKTEN Reihenfolge angeben — der Renderer mischt sie selbst.',
      'Mindestens 2 items. Teilpunkte über den Anteil korrekter Nachbarpaare.',
    ],
    answerFormat: 'string[] — die item-ids in gewählter Reihenfolge.',
    example: {
      id: 'ord1',
      type: 'order',
      instruction: 'Bringe die Schritte einer Suche in die richtige Reihenfolge.',
      items: [
        { id: 's1', text: 'Suchmaschine öffnen' },
        { id: 's2', text: 'Suchbegriff eingeben' },
        { id: 's3', text: 'Ergebnis anklicken' },
      ],
    },
  },
};
