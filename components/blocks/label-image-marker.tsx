'use client';

import type { LabelImageBlock as LabelImageBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { zoneBoxStyle, zoneShapeClass } from '@/lib/blocks/hotspot-geometry';

// Ein Zonen-Marker für „Bild-Beschriften": absolut über dem Bild, zeigt die
// Nummer (leer) oder den zugeordneten Begriff. Nach dem Prüfen grün (richtig)
// / rot (falsch). Vor dem Prüfen klickbar (Zone aktivieren); zugeordnete Zone
// hat ein „×" zum Zurücklegen.

type Zone = LabelImageBlockType['zones'][number];

function markerColor(assigned: string | undefined, zone: Zone, checked: boolean, active: boolean) {
  if (checked) {
    return assigned === zone.label
      ? 'border-green-600 bg-green-500/30 text-green-900'
      : 'border-red-600 bg-red-500/30 text-red-900';
  }
  if (active) return 'border-primary bg-primary/30 text-primary';
  if (assigned) return 'border-primary bg-primary/15 text-primary';
  return cn('border-white/80 bg-black/30 text-white', 'hover:bg-primary/40');
}

// „×" zum Zurücklegen, als verschachtelter Klick (role=button statt <button>,
// um button-in-button zu vermeiden). Stoppt die Propagation zum Marker-Klick.
function RemovePill({ label, onUnassign }: { label: string; onUnassign: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onUnassign();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onUnassign();
        }
      }}
      aria-label={`${label} zurücklegen`}
      className="-mr-0.5 leading-none opacity-70 hover:opacity-100"
    >
      ×
    </span>
  );
}

export function LabelImageMarker({
  zone,
  index,
  assigned,
  active,
  checked,
  locked,
  onSelect,
  onUnassign,
}: {
  zone: Zone;
  index: number;
  assigned: string | undefined;
  active: boolean;
  checked: boolean;
  locked: boolean;
  onSelect: () => void;
  onUnassign: () => void;
}) {
  const aria = assigned ? `Stelle ${index + 1}: ${assigned}` : `Stelle ${index + 1} beschriften`;
  return (
    <span
      style={zoneBoxStyle(zone)}
      className={cn('pointer-events-none absolute border-2', zoneShapeClass(zone))}
    >
      <button
        type="button"
        disabled={locked}
        onClick={onSelect}
        aria-label={aria}
        aria-pressed={active}
        className={cn(
          'pointer-events-auto absolute top-1/2 left-1/2 inline-flex max-w-[180%] -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm transition-colors',
          markerColor(assigned, zone, checked, active)
        )}
      >
        {assigned ?? index + 1}
        {assigned && !locked && <RemovePill label={assigned} onUnassign={onUnassign} />}
      </button>
    </span>
  );
}
