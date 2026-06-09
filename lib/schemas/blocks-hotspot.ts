import { z } from 'zod';

// Zonen-Schema für Bild-Hotspots. Ausgelagert aus blocks.ts (Zeilen-Grenze).
// Zonen sind Kreise (`shape:'circle'`, `r` = Radius rel. zur Bildbreite) oder
// Rechtecke (`shape:'rect'`, `width` rel. zur Bildbreite, `height` rel. zur
// Bild-HÖHE), optional rotiert (`rotation` in Grad). `shape`/`rotation` haben
// Defaults, damit Bestands-Zonen (nur x/y/r/isCorrect) OHNE Migration gültig
// bleiben.

export const HOTSPOT_SHAPES = ['circle', 'rect'] as const;
export type HotspotShape = (typeof HOTSPOT_SHAPES)[number];

// Optionale Gruppen: ohne `groups` ist der Block im Einfach-Modus (eine Frage).
// Mit Gruppen löst die Schüler:in nacheinander pro Gruppe („Tippe alle X an").
export const hotspotGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const hotspotAreaSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    // Optionaler Erklärtext, der NACH dem Prüfen unter dem Bild erscheint
    // („Maus = Eingabegerät ✓"). Für richtige Zonen wie für Ablenker.
    feedback: z.string().optional(),
    x: z.number().min(0).max(1), // Mittelpunkt, beide Formen
    y: z.number().min(0).max(1),
    shape: z.enum(HOTSPOT_SHAPES).default('circle'), // Bestand → 'circle'
    r: z.number().min(0.02).max(0.5).optional(), // nur Kreis
    width: z.number().min(0.04).max(1).optional(), // nur Rechteck (rel. zur Breite)
    height: z.number().min(0.04).max(1).optional(), // nur Rechteck (rel. zur Höhe)
    rotation: z.number().min(0).max(359).default(0), // Bestand → 0
    isCorrect: z.boolean(),
    groupId: z.string().min(1).optional(), // nur Gruppen-Modus; sonst weglassen
  })
  .superRefine((a, ctx) => {
    if (a.shape === 'circle' && a.r === undefined) {
      ctx.addIssue({ code: 'custom', path: ['r'], message: 'Kreis-Zone braucht r.' });
    }
    if (a.shape === 'rect' && (a.width === undefined || a.height === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: ['width'],
        message: 'Rechteck-Zone braucht width + height.',
      });
    }
  });
