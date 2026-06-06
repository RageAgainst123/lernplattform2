import type { Block, BlockType } from '@/lib/schemas/blocks';

// Kuratierter Katalog aller 13 Block-Typen mit lehrer:innen-verständlicher
// Kurzbeschreibung — damit Geo im „Block hinzufügen"-Dialog nicht raten muss
// was ein Typ tut. Quelle der Beschreibungen: docs/MODUL-SPEZIFIKATION.md §3.
// Reihenfolge innerhalb jeder Gruppe = empfohlene Verwendungs-Häufigkeit.

export type BlockCatalogEntry = {
  type: BlockType;
  label: string;
  description: string;
};

export const BLOCK_CATALOG = {
  theory: [
    {
      type: 'slide',
      label: 'Folie (slide)',
      description:
        'Großer Titel + Text am Beamer. Für reine Theorie-Folien während einer Live-Präsentation.',
    },
    {
      type: 'text',
      label: 'Text',
      description: 'Erklärtext, optional mit Bild. Funktioniert in Worksheet- und Beamer-Modus.',
    },
    {
      type: 'infobox',
      label: 'Merksatz (infobox)',
      description: 'Hervorgehobener „Merke"-Kasten — kurz und prägnant.',
    },
  ],
  worksheet: [
    {
      type: 'multiple_choice',
      label: 'Multiple Choice',
      description: 'Mehrfachauswahl mit ≥ 2 Optionen, mind. eine richtig. Auto-bewertet.',
    },
    {
      type: 'true_false',
      label: 'Wahr/Falsch',
      description: 'Aussage + Wahr/Falsch-Antwort + Feedback. Auto-bewertet.',
    },
    {
      type: 'fill_blank',
      label: 'Lückentext',
      description: 'Text mit Platzhaltern {0}, {1} und Lösungswörtern. Auto-bewertet.',
    },
    {
      type: 'match',
      label: 'Zuordnung (match)',
      description:
        'Begriffe einer Kategorie zuordnen. Mind. 2 unterschiedliche Kategorien. Auto-bewertet.',
    },
    {
      type: 'categorize',
      label: 'Kategorien-Zuordnung (categorize)',
      description:
        'Begriffe in 2–4 benannte Behälter einsortieren (z.B. „Eingabe / Verarbeitung / Ausgabe"). Mehrere Begriffe pro Behälter möglich. Auto-bewertet mit Teilpunkten.',
    },
    {
      type: 'reflection',
      label: 'Reflexion (Freitext)',
      description: 'Offene Frage, freie Antwort. Nicht auto-bewertet — Lehrer:in liest selbst.',
    },
  ],
  live: [
    {
      type: 'live_poll',
      label: 'Live-Abstimmung',
      description:
        'Unbenotetes Meinungsbild („Wie geht es dir heute?"). Schüler:innen wählen aus Optionen, Beamer zeigt Balken nach „Ergebnis zeigen".',
    },
    {
      type: 'quiz_poll',
      label: 'Quiz mit Auflösung',
      description:
        'Frage mit richtiger Antwort. Schüler:innen sehen die Lösung NICHT vorab — erst beim Klick auf „Auflösen" wird grün markiert.',
    },
    {
      type: 'word_cloud',
      label: 'Wortwolke (Freitext)',
      description:
        'Schüler:innen tippen ein Wort (max 40 Zeichen). Häufige Wörter erscheinen größer am Beamer.',
    },
    {
      type: 'scale',
      label: 'Skala 1–N',
      description:
        'Bewertung auf einer Skala (Default 1–5) mit optionalen Labels. Beamer zeigt Durchschnitt + Balken.',
    },
    {
      type: 'understanding',
      label: 'Verständnis-Ampel',
      description:
        '🟢 Verstanden · 🟡 Unsicher · 🔴 Noch nicht. Schneller Stimmungs-Check zum Ende einer Theorieeinheit.',
    },
  ],
} as const satisfies Record<string, readonly BlockCatalogEntry[]>;

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
// im Editor sofort lesbar (b1/m1/p1/s1 statt langer UUIDs). Lookup-Map statt
// switch, damit die zyklomatische Komplexität klein bleibt.
const ID_PREFIX: Record<BlockType, string> = {
  text: 'b',
  infobox: 'b',
  slide: 's',
  multiple_choice: 'mc',
  true_false: 'tf',
  fill_blank: 'fb',
  match: 'm',
  categorize: 'cat',
  reflection: 'r',
  live_poll: 'p',
  quiz_poll: 'q',
  word_cloud: 'w',
  scale: 'sc',
  understanding: 'u',
};

// Default-Stubs pro Block-Typ. Jeder Stub MUSS blockSchema.safeParse() ohne id
// bestehen — sie wird beim Erzeugen on-the-fly eingesetzt. Lookup-Map statt
// switch hält createDefaultBlock unter der Complexity-Schwelle.
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
// sinnvoll vorbelegt. existingIds vermeidet id-Kollisionen (zwei „b1" würden
// im Editor brechen).
export function createDefaultBlock(type: BlockType, existingIds: readonly string[]): Block {
  const id = nextId(ID_PREFIX[type], existingIds);
  return STUB_BUILDERS[type](id);
}
