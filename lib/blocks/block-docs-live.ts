import type { BlockDoc } from './block-docs-types.ts';

// Doku-Registry: Live-/Beamer-Interaktionen (live_poll, quiz_poll, word_cloud,
// scale, understanding). Alle unbenotet (kein Score-Beitrag) — Stimmen leben in
// live_votes. Siehe block-docs.ts für den Gesamt-Kontext.

export const LIVE_DOCS: Record<string, BlockDoc> = {
  live_poll: {
    type: 'live_poll',
    group: 'live',
    graded: 'none',
    aiHints: [
      'Unbenotetes Meinungsbild — KEIN correct-Flag (anders als quiz_poll).',
      'Mindestens 2 Optionen. Beamer zeigt Balken nach „Ergebnis zeigen".',
    ],
    answerFormat: 'option-id (Stimme, in live_votes) — kein Score.',
    example: {
      id: 'p1',
      type: 'live_poll',
      question: 'Wie oft suchst du pro Tag im Internet?',
      options: [
        { id: 'o1', text: 'Selten' },
        { id: 'o2', text: 'Ein paar Mal' },
        { id: 'o3', text: 'Ständig' },
      ],
    },
  },
  quiz_poll: {
    type: 'quiz_poll',
    group: 'live',
    graded: 'none',
    aiHints: [
      'Wie live_poll, aber mit correct-Flag pro Option. Das Flag geht NIE an Schüler:innen-Geräte.',
      'Erst beim Klick auf „Auflösen" markiert der Beamer die richtige Option.',
      'Mindestens eine Option mit correct:true.',
    ],
    answerFormat: 'option-id (Stimme, in live_votes) — kein Score-Beitrag.',
    example: {
      id: 'q1',
      type: 'quiz_poll',
      question: 'Was sortiert eine Suchmaschine?',
      options: [
        { id: 'o1', text: 'Treffer nach Relevanz', correct: true },
        { id: 'o2', text: 'Deine Dateien', correct: false },
      ],
    },
  },
  word_cloud: {
    type: 'word_cloud',
    group: 'live',
    graded: 'none',
    aiHints: [
      'Schüler:innen tippen ein Freitext-Wort (max 40 Zeichen). Beamer zeigt häufige Wörter größer.',
      'Nur eine Frage — keine Optionen.',
    ],
    answerFormat: 'string (ein Wort, in live_votes.free_text) — kein Score.',
    example: {
      id: 'w1',
      type: 'word_cloud',
      question: 'Welches Wort fällt dir zu „Internet" ein?',
    },
  },
  scale: {
    type: 'scale',
    group: 'live',
    graded: 'none',
    aiHints: [
      'Bewertung auf einer Skala (Default 1–5). min/max sind ganze Zahlen.',
      'minLabel/maxLabel sind optionale Beschriftungen der Endpunkte.',
    ],
    answerFormat: 'Zahl auf der Skala (in live_votes) — kein Score.',
    example: {
      id: 'sc1',
      type: 'scale',
      question: 'Wie sicher fühlst du dich beim Suchen im Internet?',
      min: 1,
      max: 5,
      minLabel: 'Unsicher',
      maxLabel: 'Sehr sicher',
    },
  },
  understanding: {
    type: 'understanding',
    group: 'live',
    graded: 'none',
    aiHints: [
      'Verständnis-Ampel: feste 3 Optionen (🟢/🟡/🔴) — keine eigenen Optionen angeben.',
      'question ist optional. Schneller Stimmungs-Check am Ende einer Theorieeinheit.',
    ],
    answerFormat: 'Ampel-Signal (grün/gelb/rot, in live_votes) — kein Score.',
    example: {
      id: 'u1',
      type: 'understanding',
      question: 'Hast du verstanden, wie eine Suchmaschine arbeitet?',
    },
  },
};
