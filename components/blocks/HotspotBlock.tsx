'use client';

import { useMemo } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { HotspotZone } from '@/components/blocks/hotspot-overlay';
import { HotspotGroupRunner } from '@/components/blocks/hotspot-groups';
import { HotspotHiddenSurface } from '@/components/blocks/hotspot-hidden';

// Bild-Hotspots: ein Bild mit sichtbaren Zonen. Schüler:in tippt die richtigen
// Zonen an. Zonen sind absolut positionierte Buttons ÜBER dem (plain) <img> —
// kein button-in-button, da das Bild kein Button ist.
//
// answer: string[] der angetippten areaIds. checked = grün/rot/gelb-Bewertung,
// readOnly = gesperrt. Mit block.groups → mehrschrittiger Gruppen-Modus
// (HotspotGroupRunner), sonst die Einfach-Ansicht unten.

type Props = {
  block: HotspotBlockType;
  answer: string[];
  checked: boolean;
  readOnly?: boolean;
  onSelect: (next: string[]) => void;
};

export function HotspotBlock(props: Props) {
  if (props.block.groups && props.block.groups.length > 0) {
    return <HotspotGroupRunner {...props} />;
  }
  return <HotspotSimple {...props} />;
}

function HotspotSimple({ block, answer, checked, readOnly = false, onSelect }: Props) {
  const locked = checked || readOnly;
  const picked = useMemo(() => new Set(answer), [answer]);

  function toggle(id: string) {
    if (locked) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect([...next]);
  }

  // Versteckte Zonen + noch nicht geprüft → Frei-Klick-Fläche (keine Rahmen).
  // Nach dem Prüfen werden die Zonen aufgedeckt (regulärer Pfad unten).
  if (block.revealZones === false && !locked) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-medium">{block.instruction}</p>
        <HotspotHiddenSurface
          imageUrl={block.imageUrl}
          imageAlt={block.imageAlt}
          zones={block.areas}
          picked={picked}
          locked={locked}
          onToggle={toggle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.instruction}</p>
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-md border">
        {/* eslint-disable-next-line @next/next/no-img-element -- Modul-Bilder aus Storage/Pexels, kein next/image nötig */}
        <img src={block.imageUrl} alt={block.imageAlt ?? ''} className="block w-full" />
        {block.areas.map((area, i) => (
          <HotspotZone
            key={area.id}
            area={area}
            picked={picked.has(area.id)}
            checked={checked}
            locked={locked}
            index={i}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}
