'use client';

import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { zoneBoxStyle, zoneShapeClass } from '@/lib/blocks/hotspot-geometry';

// Sub-Komponenten des HotspotBlock (ausgelagert wegen Zeilen-Limit):
// eine klickbare Zone als absolut positionierter Kreis über dem Bild.

type Area = HotspotBlockType['areas'][number];

// Farbgebung einer Zone je nach Markier-/Bewertungs-Status.
// Bewertungs-Overlays bewusst transparent (/12–/15) + dickerer Rand, damit das
// Objekt UNTER der Zone erkennbar bleibt (sonst lernt man „grüne Fläche" statt
// „dieses Objekt"). Ungetippte/markierte Zonen haben zusätzlich einen dunklen
// Außen-Ring (drop-shadow), damit der helle Rahmen auch auf hellem Bild­hinter­
// grund (z.B. Holztisch) sichtbar bleibt — siehe Audit-Befund Kontrast.
function zoneClass(opts: {
  picked: boolean;
  checked: boolean;
  isCorrect: boolean;
  locked: boolean;
}): string {
  const { picked, checked, isCorrect, locked } = opts;
  if (checked) {
    if (picked && isCorrect) return 'border-4 border-green-500 bg-green-500/12';
    if (picked && !isCorrect) return 'border-4 border-red-500 bg-red-500/12';
    // richtig, aber nicht angetippt → gelb gestrichelt (verpasst)
    if (!picked && isCorrect) return 'border-4 border-dashed border-amber-500 bg-amber-400/12';
    return 'border-transparent';
  }
  if (picked)
    return 'border-primary border-[3px] bg-primary/20 [filter:drop-shadow(0_0_1px_rgb(0_0_0/0.9))]';
  return cn(
    'border-white border-[3px] bg-black/5 [filter:drop-shadow(0_0_1.5px_rgb(0_0_0/0.85))]',
    !locked && 'hover:bg-primary/20'
  );
}

// Eine Zone = absolut positionierter, kreisrunder Button. Position/Größe in %
// relativ zum Bild-Container (x,y = Mittelpunkt, r = Radius zur Breite).
export function HotspotZone({
  area,
  picked,
  checked,
  locked,
  index,
  onToggle,
}: {
  area: Area;
  picked: boolean;
  checked: boolean;
  locked: boolean;
  index: number;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      aria-label={area.label ?? `Bereich ${index + 1}`}
      aria-pressed={picked}
      onClick={() => onToggle(area.id)}
      style={zoneBoxStyle(area)}
      className={cn(
        'absolute border-2 transition-colors',
        zoneShapeClass(area),
        zoneClass({ picked, checked, isCorrect: area.isCorrect, locked })
      )}
    />
  );
}
