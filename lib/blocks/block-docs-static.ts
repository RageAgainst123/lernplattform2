import type { BlockDoc } from './block-docs-types.ts';

// Doku-Registry: Theorie-/Inhalts-Blöcke (text, infobox, slide) + reflection.
// Nicht-bewertete Blöcke. Siehe block-docs.ts für den Gesamt-Kontext.

export const STATIC_DOCS: Record<string, BlockDoc> = {
  text: {
    type: 'text',
    group: 'theory',
    graded: 'none',
    aiHints: [
      'Reiner Erklärtext (Hook/Einleitung). Kurze Sätze, Du-Form, max ~20 Wörter.',
      'imageUrl ist optional und muss eine echte URL sein — im Zweifel weglassen.',
    ],
    answerFormat: 'keine — reiner Inhalt, nicht bewertet.',
    example: {
      id: 'b1',
      type: 'text',
      content: 'Eine Suchmaschine durchsucht das halbe Internet — in Sekunden.',
    },
  },
  infobox: {
    type: 'infobox',
    group: 'theory',
    graded: 'none',
    aiHints: [
      'Hervorgehobener „Merke"-Kasten — EIN prägnanter Kerngedanke, nicht mehrere.',
      'title ist optional; ohne title wird „Merke" angezeigt.',
    ],
    answerFormat: 'keine — reiner Inhalt, nicht bewertet.',
    example: {
      id: 'b2',
      type: 'infobox',
      title: 'Merke',
      content: 'Gib in Suchmaschinen nie persönliche Daten wie Adresse oder Passwort ein.',
    },
  },
  slide: {
    type: 'slide',
    group: 'theory',
    graded: 'none',
    aiHints: [
      'Beamer-Folie für den geführten Einstieg (display_mode "presentation").',
      'title ist Pflicht, body optional. Knapp halten — wird groß projiziert.',
    ],
    answerFormat: 'keine — Präsentationsfolie, nicht bewertet.',
    example: {
      id: 's1',
      type: 'slide',
      title: 'Was ist eine Suchmaschine?',
      body: 'Ein Werkzeug, das Webseiten findet und nach Relevanz sortiert.',
    },
  },
  reflection: {
    type: 'reflection',
    group: 'worksheet',
    graded: 'none',
    aiHints: [
      'Offene Frage, freie Antwort — wird NICHT auto-bewertet (Lehrer:in liest selbst).',
      'Als Abschluss eines Moduls gedacht. placeholder ist optional.',
    ],
    answerFormat: 'string (Freitext der Schüler:in).',
    example: {
      id: 'r1',
      type: 'reflection',
      prompt: 'Wofür hast du diese Woche eine Suchmaschine benutzt?',
      placeholder: 'Schreibe 2–3 Sätze …',
    },
  },
};
