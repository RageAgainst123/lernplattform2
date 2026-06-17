import type { BlockDoc } from './block-docs-types.ts';

// Doku-Registry: Spiel-Aufgaben mit Teilpunkten (memory, crossword,
// word_search, scramble, hangman). Siehe block-docs.ts für den Gesamt-Kontext.

export const GAME_DOCS: Record<string, BlockDoc> = {
  memory: {
    type: 'memory',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      '3–8 Paare, jede pair-id eindeutig.',
      'Jede Karte (a und b) hat ENTWEDER text ODER imageUrl — nie beides, nie keins.',
      'Deckt Begriff–Begriff, Begriff–Definition oder Begriff–Bild ab.',
    ],
    answerFormat: 'string[] — die erfolgreich gefundenen pair-ids.',
    example: {
      id: 'mem1',
      type: 'memory',
      instruction: 'Finde die Paare: Gerät und seine Aufgabe.',
      pairs: [
        { id: 'pa', a: { text: 'Tastatur' }, b: { text: 'Texte eingeben' } },
        { id: 'pb', a: { text: 'Bildschirm' }, b: { text: 'Bilder anzeigen' } },
        { id: 'pc', a: { text: 'Drucker' }, b: { text: 'auf Papier ausgeben' } },
      ],
    },
  },
  crossword: {
    type: 'crossword',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'answer NUR Großbuchstaben (A–Z, Ä, Ö, Ü); ß als „SS" schreiben.',
      'across belegt (row, col+i), down belegt (row+i, col).',
      'Kreuzende Wörter MÜSSEN am Schnittpunkt denselben Buchstaben haben.',
      'Im Zweifel Wörter ohne Kreuzung legen — Konflikte lehnt validate:module ab.',
    ],
    answerFormat: 'Record<"r,c", Buchstabe> — ein Buchstabe je Zelle.',
    // MAUS quer (0,0..0,3); AKKU runter (0,1..3,1) — Schnittzelle (0,1) = A.
    example: {
      id: 'cw1',
      type: 'crossword',
      instruction: 'Löse das Kreuzworträtsel rund um den Computer.',
      rows: 4,
      cols: 4,
      words: [
        {
          id: 'w1',
          answer: 'MAUS',
          clue: 'Zeigegerät zum Klicken',
          direction: 'across',
          row: 0,
          col: 0,
        },
        {
          id: 'w2',
          answer: 'AKKU',
          clue: 'Speichert Strom im Laptop',
          direction: 'down',
          row: 0,
          col: 1,
        },
      ],
    },
  },
  word_search: {
    type: 'word_search',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'word NUR Großbuchstaben (ß als „SS"). Jedes Wort darf nur einmal vorkommen.',
      'across (row, col+i), down (row+i, col), diag (row+i, col+i — nach rechts unten).',
      'Wörter dürfen sich kreuzen, müssen aber an geteilten Zellen denselben Buchstaben haben.',
      '3–12 Wörter, Gitter 5×5 bis 15×15 — Wörter dürfen nicht aus dem Gitter ragen.',
    ],
    answerFormat: 'string[] — die gefundenen word-ids.',
    // 7×7: MAUS quer (0,0); AKKU runter (2,0); WLAN quer (4,2) — keine Überlappung.
    example: {
      id: 'wsr1',
      type: 'word_search',
      instruction: 'Finde die versteckten Computer-Wörter.',
      rows: 7,
      cols: 7,
      words: [
        { id: 'w1', word: 'MAUS', direction: 'across', row: 0, col: 0 },
        { id: 'w2', word: 'AKKU', direction: 'down', row: 2, col: 0 },
        { id: 'w3', word: 'WLAN', direction: 'across', row: 4, col: 2 },
      ],
    },
  },
  scramble: {
    type: 'scramble',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'word NUR Großbuchstaben (ß als „SS"), 2–14 Zeichen. 1–8 Wörter.',
      'hint pro Wort ist optional, aber bei längeren Wörtern hilfreich.',
      'Die Buchstaben werden automatisch gemischt — du gibst nur das Lösungswort an.',
    ],
    answerFormat: 'Record<wordId, gebautes Wort> — je Wort die getippte Reihenfolge.',
    example: {
      id: 'sal1',
      type: 'scramble',
      instruction: 'Setze die Buchstaben zum richtigen Wort zusammen.',
      words: [
        { id: 'w1', word: 'MAUS', hint: 'Zeigegerät' },
        { id: 'w2', word: 'TASTATUR', hint: 'Damit tippst du' },
      ],
    },
  },
  hangman: {
    type: 'hangman',
    group: 'worksheet',
    graded: 'partial',
    aiHints: [
      'word NUR Großbuchstaben (ß als „SS"), 2–14 Zeichen. 1–6 Wörter.',
      'hint ist PFLICHT pro Wort — reines Raten ohne Hinweis ist frustrierend.',
      'maxWrong (3–10, Default 6) = erlaubte Fehlversuche pro Wort.',
    ],
    answerFormat: 'string[] — die gelösten word-ids.',
    example: {
      id: 'gal1',
      type: 'hangman',
      instruction: 'Errate das Wort Buchstabe für Buchstabe.',
      maxWrong: 6,
      words: [
        { id: 'w1', word: 'INTERNET', hint: 'Weltweites Netz aus Computern' },
        { id: 'w2', word: 'PASSWORT', hint: 'Geheim — schützt dein Konto' },
      ],
    },
  },
};
