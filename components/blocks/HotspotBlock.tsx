'use client';

import { useMemo } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { HotspotZone } from '@/components/blocks/hotspot-overlay';

// Bild-Hotspots: ein Bild mit sichtbaren Kreis-Zonen. Schüler:in tippt die
// richtigen Zonen an. Zonen sind absolut positionierte Buttons ÜBER dem
// (plain) <img> — kein button-in-button, da das Bild kein Button ist.
//
// answer: string[] der angetippten areaIds. checked = grün/rot/gelb-Bewertung,
// readOnly = gesperrt.

type Props = {
  block: HotspotBlockType;
  answer: string[];
  checked: boolean;
  readOnly?: boolean;
  onSelect: (next: string[]) => void;
};

export function HotspotBlock({ block, answer, checked, readOnly = false, onSelect }: Props) {
  const locked = checked || readOnly;
  const picked = useMemo(() => new Set(answer), [answer]);

  function toggle(id: string) {
    if (locked) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect([...next]);
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
