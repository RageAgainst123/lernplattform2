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
// Kreis: Breite = 2·r (Höhe via aspect-square in der Klasse). Rechteck: Breite =
// width, Höhe via aspectRatio width/height (container-höhen-unabhängig, wie der
// Kreis). Rotation als zusätzlicher transform-Anteil.
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
    return { ...base, width: `${w * 100}%`, aspectRatio: `${w} / ${h}` };
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
