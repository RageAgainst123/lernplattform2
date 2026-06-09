import { z } from 'zod';
import { HOTSPOT_SHAPES } from './blocks-hotspot.ts';
import { blockId, gradedBlockExtensions } from './blocks-shared.ts';

// Zonen-Schema für „Bild-Beschriften" (label_image). Geometrisch identisch zu
// hotspot (Kreis/Rechteck, Rotation, relative Koordinaten 0–1), ABER `label`
// ist hier PFLICHT = der Soll-Begriff, den die Schüler:in der Zone zuordnet.
// Kein isCorrect/groupId/feedback — jede Zone hat genau einen richtigen Begriff.

export const labelImageZoneSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1), // Soll-Begriff (Pflicht)
    x: z.number().min(0).max(1), // Mittelpunkt
    y: z.number().min(0).max(1),
    shape: z.enum(HOTSPOT_SHAPES).default('circle'),
    r: z.number().min(0.02).max(0.5).optional(), // nur Kreis
    width: z.number().min(0.04).max(1).optional(), // nur Rechteck (rel. Breite)
    height: z.number().min(0.04).max(1).optional(), // nur Rechteck (rel. Höhe)
    rotation: z.number().min(0).max(359).default(0),
  })
  .superRefine((z2, ctx) => {
    if (z2.shape === 'circle' && z2.r === undefined) {
      ctx.addIssue({ code: 'custom', path: ['r'], message: 'Kreis-Zone braucht r.' });
    }
    if (z2.shape === 'rect' && (z2.width === undefined || z2.height === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['width'],
        message: 'Rechteck-Zone braucht width + height.',
      });
    }
  });

// Bild-Beschriften: Stellen im Bild den richtigen Begriffen zuordnen. Schüler:in
// tippt eine Zone an → wählt den passenden Begriff. Teilpunkte (richtig
// zugeordnete / Anzahl Zonen). Geteilte Bausteine (blockId/gradedBlockExtensions)
// aus blocks-shared.ts → kein Zirkel-Import mit blocks.ts.
export const labelImageBlockSchema = z.object({
  id: blockId,
  type: z.literal('label_image'),
  instruction: z.string(),
  imageUrl: z.string().url(),
  imageAlt: z.string().optional(),
  zones: z.array(labelImageZoneSchema).min(2).max(20), // 2–20 Zonen, je Soll-Begriff
  revealZones: z.boolean().default(true), // sichtbar (Marker) / versteckt (frei klicken)
  zoomable: z.boolean().default(false),
  ...gradedBlockExtensions,
});
