import type { CSSProperties } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';

// Pure Geometrie-Helfer für Hotspot-Zonen — von Renderer (HotspotZone) UND
// Editor-Vorschau (HotspotImageEditor) genutzt, damit beide pixelgenau gleich
// positionieren (kein Drift). Defensiv: liest shape/rotation mit Fallback, weil
// der Admin-Editor `modules.content` NICHT durch Zod parst (Defaults greifen
// dort nicht).

type Area = HotspotBlock['areas'][number];

// Liefert die absolute Positionierung + Form einer Zone als Inline-Style,
// relativ zum Bild-Container (x,y = Mittelpunkt in %, translate zentriert).
// Kreis: Breite = 2·r (Höhe via aspect-square in der Klasse), r relativ zur
// Bildbreite. Rechteck: Breite = width (relativ zur Bildbreite), Höhe = height
// (relativ zur Bild-HÖHE) — beide Achsen getrennt, damit Editor-Aufziehen,
// gespeicherte Zone und Schüler-Renderer pixelgenau übereinstimmen (alle zeigen
// dasselbe Bild im selben w-full-Container, also identische Höhe). Rotation als
// zusätzlicher transform-Anteil.
export function zoneBoxStyle(area: Area): CSSProperties {
  const shape = area.shape ?? 'circle';
  const rotation = area.rotation ?? 0;
  const base: CSSProperties = {
    left: `${area.x * 100}%`,
    top: `${area.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  };
  if (shape === 'rect') {
    const w = area.width ?? 0.2;
    const h = area.height ?? 0.12;
    return { ...base, width: `${w * 100}%`, height: `${h * 100}%` };
  }
  const r = area.r ?? 0.08;
  return { ...base, width: `${r * 2 * 100}%` };
}

// Form-abhängige Tailwind-Klassen (Rundung + Seitenverhältnis-Erzwingung beim
// Kreis). Farbe/Border kommen separat aus zoneClass().
export function zoneShapeClass(area: Area): string {
  const shape = area.shape ?? 'circle';
  return shape === 'rect' ? 'rounded-md' : 'aspect-square rounded-full';
}

// Feste Farbpalette pro Gruppen-Index (border + bg). Macht im Editor und in der
// Lehrer:innen-Review-Ansicht sofort sichtbar, welche Zone zu welcher Gruppe
// gehört. Statisch (Tailwind muss die Klassen zur Build-Zeit sehen).
const GROUP_PALETTE = [
  'border-sky-500 bg-sky-400/25',
  'border-violet-500 bg-violet-400/25',
  'border-orange-500 bg-orange-400/25',
  'border-pink-500 bg-pink-400/25',
  'border-teal-500 bg-teal-400/25',
  'border-yellow-500 bg-yellow-400/25',
] as const;

export const HOTSPOT_GROUP_COUNT = GROUP_PALETTE.length;

// Border+bg-Klassen für eine Gruppe nach Index (mod Palette-Länge).
export function hotspotGroupColor(index: number): string {
  return GROUP_PALETTE[
    ((index % GROUP_PALETTE.length) + GROUP_PALETTE.length) % GROUP_PALETTE.length
  ];
}

// ── Frei-Klick (versteckte Zonen) ────────────────────────────────────────────
// Treffer-Test für „revealZones=false": die Schüler:in klickt frei aufs Bild,
// ein Treffer zählt, wenn der Klick INNERHALB einer Zone liegt. Pure Funktion,
// damit sie testbar ist und Renderer + Tests dieselbe Logik teilen.
//
// px/py = Klickposition relativ (0–1), wie zoneBoxStyle: x rel. zur Breite,
// y rel. zur HÖHE. `aspect` = Bildhöhe/Bildbreite (clientHeight/clientWidth) —
// nötig, weil r/width rel. zur Breite, height rel. zur Höhe definiert sind und
// Rotation einen einheitlichen Maßstab braucht. Bei rotation=0 (Normalfall) ist
// der Test exakt, aspect spielt nur für den Kreis (runde Distanz) eine Rolle.

// Punkt um −deg um den Ursprung drehen (im Pixel-/aspect-Raum).
function rotateBack(dx: number, dy: number, deg: number): { x: number; y: number } {
  if (deg === 0) return { x: dx, y: dy };
  const rad = (-deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

export function pointInArea(area: Area, px: number, py: number, aspect = 1): boolean {
  const shape = area.shape ?? 'circle';
  // In Breiten-Einheiten rechnen: y mit aspect skalieren (py rel. Höhe → Breite).
  const dx = px - area.x;
  const dy = (py - area.y) * aspect;
  if (shape === 'rect') {
    const w = area.width ?? 0.2;
    const h = (area.height ?? 0.12) * aspect; // halbe Höhe ebenfalls in Breiten-Einheiten
    const rot = rotateBack(dx, dy, area.rotation ?? 0);
    return Math.abs(rot.x) <= w / 2 && Math.abs(rot.y) <= h / 2;
  }
  const r = area.r ?? 0.08;
  return dx * dx + dy * dy <= r * r;
}

// Alle Zonen, die den Punkt enthalten (überlappende Zonen möglich). Der Renderer
// nimmt i.d.R. die erste. `aspect` = Bildhöhe/Bildbreite.
export function hitAreaIds(areas: Area[], px: number, py: number, aspect = 1): string[] {
  return areas.filter((a) => pointInArea(a, px, py, aspect)).map((a) => a.id);
}
