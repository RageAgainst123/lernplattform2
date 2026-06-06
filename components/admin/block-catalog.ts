import type { BlockType } from '@/lib/schemas/blocks';

// Kuratierter Katalog aller 15 Block-Typen mit lehrer:innen-verständlicher
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
      type: 'mark_words',
      label: 'Markieren im Text (mark_words)',
      description:
        'Wörter im Fließtext antippen, die zu einem Kriterium passen (z.B. „Markiere alle persönlichen Daten"). Teilpunkte, Falschmarkierungen ziehen ab.',
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

// Default-Stub-Erzeugung lebt in block-stubs.ts (Zeilen-Limit). Re-Export,
// damit Bestands-Importe aus block-catalog weiter funktionieren.
export { createDefaultBlock } from './block-stubs';
