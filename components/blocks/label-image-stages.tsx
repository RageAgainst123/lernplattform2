'use client';

import type { LabelImageBlock as LabelImageBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { HotspotImageStage, ZoomImageFrame } from '@/components/blocks/hotspot-zoom';
import { LabelImageMarker } from '@/components/blocks/label-image-marker';

// Die beiden Bild-Bühnen für „Bild-Beschriften" (ausgelagert aus
// LabelImageBlock wegen der Zeilen-Grenze): sichtbare Marker-Bühne und die
// versteckte Frei-Klick-Bühne.

type Zone = LabelImageBlockType['zones'][number];

// Sichtbarer Modus: Bild + nummerierte/beschriftete Marker.
export function LabelMarkers({
  block,
  assignment,
  active,
  checked,
  locked,
  onSelect,
  onUnassign,
}: {
  block: LabelImageBlockType;
  assignment: Record<string, string>;
  active: string | null;
  checked: boolean;
  locked: boolean;
  onSelect: (id: string) => void;
  onUnassign: (id: string) => void;
}) {
  return (
    <HotspotImageStage
      imageUrl={block.imageUrl}
      imageAlt={block.imageAlt}
      zoomable={block.zoomable === true}
    >
      {block.zones.map((zone: Zone, i: number) => (
        <LabelImageMarker
          key={zone.id}
          zone={zone}
          index={i}
          assigned={assignment[zone.id]}
          active={active === zone.id}
          checked={checked}
          locked={locked}
          onSelect={() => onSelect(zone.id)}
          onUnassign={() => onUnassign(zone.id)}
        />
      ))}
    </HotspotImageStage>
  );
}

// Versteckter Modus (vor Prüfen): freie Klickfläche, kein Marker. Ein Klick in
// einer Zone aktiviert sie (zum Beschriften); die aktive Stelle ist ein Punkt.
export function LabelHiddenStage({
  block,
  innerRef,
  onFreeClick,
  active,
}: {
  block: LabelImageBlockType;
  innerRef: React.Ref<HTMLDivElement>;
  onFreeClick: (e: React.PointerEvent<HTMLDivElement>) => void;
  active: string | null;
}) {
  const activeZone = block.zones.find((z) => z.id === active);
  const cls = cn(
    'relative cursor-crosshair overflow-hidden rounded-md border',
    block.zoomable !== true && 'touch-none'
  );
  const props = {
    onPointerDown: onFreeClick,
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Klicke die Stelle an, die du beschriften willst',
  };
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ZoomImageFrame
        enabled={block.zoomable === true}
        innerRef={innerRef}
        innerClassName={cls}
        innerProps={props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Modul-Bilder aus Storage/Pexels */}
        <img
          src={block.imageUrl}
          alt={block.imageAlt ?? ''}
          className="block w-full select-none"
          draggable={false}
        />
        {activeZone && (
          <span
            style={{ left: `${activeZone.x * 100}%`, top: `${activeZone.y * 100}%` }}
            className="border-primary bg-primary/40 absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            aria-hidden
          />
        )}
      </ZoomImageFrame>
    </div>
  );
}
