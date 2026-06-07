'use client';

import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { zoneBoxStyle, zoneShapeClass } from '@/lib/blocks/hotspot-geometry';

// Sub-Komponenten des HotspotBlock (ausgelagert wegen Zeilen-Limit):
// eine klickbare Zone als absolut positionierter Kreis über dem Bild.

type Area = HotspotBlockType['areas'][number];

// Farbgebung einer Zone je nach Markier-/Bewertungs-Status.
function zoneClass(opts: {
  picked: boolean;
  checked: boolean;
  isCorrect: boolean;
  locked: boolean;
}): string {
  const { picked, checked, isCorrect, locked } = opts;
  if (checked) {
    if (picked && isCorrect) return 'border-green-600 bg-green-500/30';
    if (picked && !isCorrect) return 'border-red-600 bg-red-500/30';
    // richtig, aber nicht angetippt → gelb gestrichelt (verpasst)
    if (!picked && isCorrect) return 'border-amber-500 border-dashed bg-amber-400/20';
    return 'border-transparent';
  }
  if (picked) return 'border-primary bg-primary/30';
  return cn('border-white/70 bg-black/10', !locked && 'hover:bg-primary/20');
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
