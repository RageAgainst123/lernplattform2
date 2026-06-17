import type { BlockDoc } from './block-docs-types.ts';

// Doku-Registry: Bild-Aufgaben (hotspot, label_image). editorOnly = NICHT per
// KI-JSON bauen — die Pixel-Koordinaten kann eine KI ohne Bild nicht raten;
// die Zonen werden im Editor direkt auf dem Bild aufgezogen. Die Beispiele hier
// sind dennoch vollständig + schema-gültig (geprüft), damit sie als Referenz +
// B4-Test-Material taugen. Siehe block-docs.ts für den Gesamt-Kontext.

const PLACEHOLDER_IMG = 'https://example.com/computer.jpg';

export const IMAGE_DOCS: Record<string, BlockDoc> = {
  hotspot: {
    type: 'hotspot',
    group: 'worksheet',
    graded: 'partial',
    editorOnly: true,
    aiHints: [
      'NICHT per KI-JSON bauen — Zonen werden im Editor auf einem echten Bild aufgezogen.',
      'Koordinaten x/y/r sind relativ zur Bildbreite (0–1), nicht in Pixeln.',
      'Mindestens eine Zone muss isCorrect:true sein (Publish-Gate).',
      'area-ids müssen eindeutig sein; Kreis-Zone braucht r, Rechteck width+height.',
    ],
    answerFormat: 'string[] — die angetippten area-ids.',
    example: {
      id: 'hs1',
      type: 'hotspot',
      instruction: 'Tippe alle Eingabegeräte im Bild an.',
      imageUrl: PLACEHOLDER_IMG,
      imageAlt: 'Computer-Arbeitsplatz',
      areas: [
        {
          id: 'a1',
          label: 'Tastatur',
          x: 0.3,
          y: 0.7,
          shape: 'circle',
          r: 0.1,
          rotation: 0,
          isCorrect: true,
        },
        {
          id: 'a2',
          label: 'Bildschirm',
          x: 0.5,
          y: 0.3,
          shape: 'circle',
          r: 0.12,
          rotation: 0,
          isCorrect: false,
        },
      ],
    },
  },
  label_image: {
    type: 'label_image',
    group: 'worksheet',
    graded: 'partial',
    editorOnly: true,
    aiHints: [
      'NICHT per KI-JSON bauen — Zonen werden im Editor auf einem echten Bild gesetzt.',
      'label pro Zone ist PFLICHT = der richtige Soll-Begriff.',
      '2–20 Zonen; Begriffe müssen eindeutig sein (sonst mehrdeutig).',
      'Koordinaten relativ (0–1); Kreis braucht r, Rechteck width+height.',
    ],
    answerFormat: 'Record<zoneId, Begriff> — jeder Zone ihren Begriff.',
    example: {
      id: 'li1',
      type: 'label_image',
      instruction: 'Beschrifte die Teile des Computers.',
      imageUrl: PLACEHOLDER_IMG,
      imageAlt: 'Computer mit Bauteilen',
      zones: [
        { id: 'z1', label: 'Maus', x: 0.25, y: 0.6, shape: 'circle', r: 0.08, rotation: 0 },
        { id: 'z2', label: 'Bildschirm', x: 0.55, y: 0.3, shape: 'circle', r: 0.12, rotation: 0 },
      ],
    },
  },
};
