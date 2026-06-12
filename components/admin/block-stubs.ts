import type { Block, BlockType } from '@/lib/schemas/blocks';

// Default-Stubs + ID-Generierung für neue Blöcke im Editor. Ausgelagert aus
// block-catalog.ts, damit beide Dateien unter der Zeilen-Grenze bleiben.
// Jeder Stub MUSS blockSchema.safeParse() bestehen (ohne id, die wird beim
// Erzeugen eingesetzt) — abgesichert durch block-catalog.test.ts.

// Generiert eine garantiert eindeutige Block-id (basis-1 fortlaufend) gegen die
// bereits vorhandenen ids im Modul. Pure Funktion, ohne Date.now-Drift.
function nextId(prefix: string, existing: readonly string[]): string {
  const taken = new Set(existing);
  for (let i = 1; i < 1000; i++) {
    const candidate = `${prefix}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${prefix}${Date.now()}`;
}

// Kurzer Präfix pro Block-Typ für die generierten IDs — macht die Modul-Liste
// im Editor sofort lesbar (b1/m1/p1/s1 statt langer UUIDs).
const ID_PREFIX: Record<BlockType, string> = {
  text: 'b',
  infobox: 'b',
  slide: 's',
  multiple_choice: 'mc',
  true_false: 'tf',
  fill_blank: 'fb',
  match: 'm',
  categorize: 'cat',
  mark_words: 'mw',
  order: 'ord',
  hotspot: 'hs',
  label_image: 'li',
  memory: 'mem',
  crossword: 'cw',
  word_search: 'wsr',
  scramble: 'sal',
  hangman: 'gal',
  reflection: 'r',
  live_poll: 'p',
  quiz_poll: 'q',
  word_cloud: 'w',
  scale: 'sc',
  understanding: 'u',
};

const STUB_BUILDERS: Record<BlockType, (id: string) => Block> = {
  text: (id) => ({ id, type: 'text', content: 'Neuer Erklärtext.' }),
  infobox: (id) => ({ id, type: 'infobox', title: 'Merke', content: 'Wichtiger Merksatz.' }),
  slide: (id) => ({ id, type: 'slide', title: 'Neue Folie', body: 'Inhalt der Folie.' }),
  multiple_choice: (id) => ({
    id,
    type: 'multiple_choice',
    question: 'Neue Frage?',
    options: [
      { id: 'o1', text: 'Antwort A', correct: true },
      { id: 'o2', text: 'Antwort B', correct: false },
    ],
  }),
  true_false: (id) => ({ id, type: 'true_false', question: 'Neue Aussage.', answer: true }),
  fill_blank: (id) => ({
    id,
    type: 'fill_blank',
    text: 'Ein {0} ist ein Eingabegerät.',
    solutions: ['Beispielwort'],
    distractors: [],
  }),
  match: (id) => ({
    id,
    type: 'match',
    question: 'Ordne zu.',
    pairs: [
      { id: 'p1', term: 'Begriff A', category: 'Kategorie 1' },
      { id: 'p2', term: 'Begriff B', category: 'Kategorie 2' },
    ],
  }),
  categorize: (id) => ({
    id,
    type: 'categorize',
    question: 'Sortiere in die richtigen Behälter.',
    buckets: [
      { id: 'b1', label: 'Behälter 1' },
      { id: 'b2', label: 'Behälter 2' },
    ],
    items: [
      { id: 'i1', text: 'Begriff A', bucketId: 'b1' },
      { id: 'i2', text: 'Begriff B', bucketId: 'b2' },
    ],
  }),
  // Wort-Indizes: Anna=0, wohnt=1, in=2, Wien=3. Richtig markiert: Anna + Wien.
  mark_words: (id) => ({
    id,
    type: 'mark_words',
    instruction: 'Markiere alle persönlichen Daten.',
    text: 'Anna wohnt in Wien',
    correctIndices: [0, 3],
  }),
  order: (id) => ({
    id,
    type: 'order',
    instruction: 'Bring die Schritte in die richtige Reihenfolge.',
    // items in KORREKTER Reihenfolge — im Renderer werden sie gemischt.
    items: [
      { id: 'i1', text: 'Erster Schritt' },
      { id: 'i2', text: 'Zweiter Schritt' },
      { id: 'i3', text: 'Dritter Schritt' },
    ],
  }),
  // Platzhalter-Bild (frei nutzbar, Pexels). Im Editor sofort ersetzbar.
  hotspot: (id) => ({
    id,
    type: 'hotspot',
    instruction: 'Tippe die richtige Stelle im Bild an.',
    imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
    revealZones: true,
    zoomable: false,
    // Bewusst KEINE Vorgabe-Zone: der/die Admin zeichnet die erste Zone selbst.
    areas: [],
  }),
  // Bild-Beschriften: 2 Beispiel-Zonen (min 2 erforderlich), Begriffe ersetzbar.
  label_image: (id) => ({
    id,
    type: 'label_image',
    instruction: 'Beschrifte die markierten Stellen im Bild.',
    imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
    revealZones: true,
    zoomable: false,
    zones: [
      { id: 'z1', label: 'Begriff A', x: 0.35, y: 0.4, shape: 'circle', r: 0.08, rotation: 0 },
      { id: 'z2', label: 'Begriff B', x: 0.65, y: 0.4, shape: 'circle', r: 0.08, rotation: 0 },
    ],
  }),
  // Memory: 3 Beispiel-Paare (min 3 erforderlich), Begriffe ersetzbar.
  memory: (id) => ({
    id,
    type: 'memory',
    instruction: 'Finde die passenden Paare.',
    pairs: [
      { id: 'p1', a: { text: 'Begriff A' }, b: { text: 'Erklärung A' } },
      { id: 'p2', a: { text: 'Begriff B' }, b: { text: 'Erklärung B' } },
      { id: 'p3', a: { text: 'Begriff C' }, b: { text: 'Erklärung C' } },
    ],
  }),
  // Kreuzworträtsel: kleines valides Kreuz — MAUS (waagrecht) + MONITOR
  // (senkrecht) teilen das M bei (0,0); MONITOR (7 Buchstaben) braucht rows 7.
  crossword: (id) => ({
    id,
    type: 'crossword',
    instruction: 'Fülle das Kreuzworträtsel aus.',
    rows: 7,
    cols: 5,
    words: [
      {
        id: 'w1',
        answer: 'MAUS',
        clue: 'Eingabegerät zum Klicken',
        direction: 'across',
        row: 0,
        col: 0,
      },
      { id: 'w2', answer: 'MONITOR', clue: 'Zeigt das Bild an', direction: 'down', row: 0, col: 0 },
    ],
  }),
  // Wortsuchrätsel: 3 Beispiel-Wörter (min 3), kreuzen sich konfliktfrei im
  // gemeinsamen M bei (0,0): MAUS waagrecht, MONITOR senkrecht, TABLET diagonal.
  word_search: (id) => ({
    id,
    type: 'word_search',
    instruction: 'Finde alle versteckten Wörter.',
    rows: 8,
    cols: 8,
    words: [
      { id: 'w1', word: 'MAUS', direction: 'across', row: 0, col: 0 },
      { id: 'w2', word: 'MONITOR', direction: 'down', row: 0, col: 0 },
      { id: 'w3', word: 'TABLET', direction: 'diag', row: 1, col: 1 },
    ],
  }),
  // Buchstabensalat + Galgenmännchen: je 1 Beispiel-Wort, sofort ersetzbar.
  // prettier-ignore
  scramble: (id) => ({ id, type: 'scramble', instruction: 'Bringe die Buchstaben in die richtige Reihenfolge.', words: [{ id: 'w1', word: 'TASTATUR', hint: 'Eingabegerät mit Tasten' }] }),
  // prettier-ignore
  hangman: (id) => ({ id, type: 'hangman', instruction: 'Errate die gesuchten Begriffe.', maxWrong: 6, words: [{ id: 'w1', word: 'MONITOR', hint: 'Zeigt das Bild an' }] }),
  reflection: (id) => ({ id, type: 'reflection', prompt: 'Was hast du gelernt?' }),
  live_poll: (id) => ({
    id,
    type: 'live_poll',
    question: 'Neue Live-Frage?',
    options: [
      { id: 'o1', text: 'Antwort A' },
      { id: 'o2', text: 'Antwort B' },
    ],
  }),
  quiz_poll: (id) => ({
    id,
    type: 'quiz_poll',
    question: 'Neue Quiz-Frage?',
    options: [
      { id: 'o1', text: 'Richtige Antwort', correct: true },
      { id: 'o2', text: 'Falsche Antwort', correct: false },
    ],
  }),
  word_cloud: (id) => ({ id, type: 'word_cloud', question: 'Was fällt dir zum Thema X ein?' }),
  scale: (id) => ({
    id,
    type: 'scale',
    question: 'Wie sicher fühlst du dich?',
    min: 1,
    max: 5,
    minLabel: 'gar nicht',
    maxLabel: 'sehr sicher',
  }),
  understanding: (id) => ({ id, type: 'understanding' }),
};

// Liefert für jeden Block-Typ einen Default-Stub mit allen Pflicht-Feldern
// sinnvoll vorbelegt. existingIds vermeidet id-Kollisionen.
export function createDefaultBlock(type: BlockType, existingIds: readonly string[]): Block {
  const id = nextId(ID_PREFIX[type], existingIds);
  return STUB_BUILDERS[type](id);
}
