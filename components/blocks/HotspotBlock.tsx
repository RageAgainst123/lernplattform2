'use client';

import { useMemo } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { HotspotZone } from '@/components/blocks/hotspot-overlay';
import { HotspotGroupRunner } from '@/components/blocks/hotspot-groups';
import { HotspotHiddenSurface } from '@/components/blocks/hotspot-hidden';
import { HotspotFeedbackList } from '@/components/blocks/hotspot-feedback';
import { HotspotImageStage } from '@/components/blocks/hotspot-zoom';

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

// Versteckte Zonen + noch nicht geprüft → Frei-Klick-Fläche (keine Rahmen).
function HotspotSimpleHidden({
  block,
  picked,
  toggle,
}: {
  block: HotspotBlockType;
  picked: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.instruction}</p>
      <HotspotHiddenSurface
        imageUrl={block.imageUrl}
        imageAlt={block.imageAlt}
        zones={block.areas}
        picked={picked}
        locked={false}
        maxClicks={block.maxClicks}
        zoomable={block.zoomable === true}
        onToggle={toggle}
      />
    </div>
  );
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
  // Versteckt + ungeprüft → Frei-Klick; nach dem Prüfen regulärer Pfad (Reveal).
  if (block.revealZones === false && !locked) {
    return <HotspotSimpleHidden block={block} picked={picked} toggle={toggle} />;
  }
  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.instruction}</p>
      <HotspotImageStage
        imageUrl={block.imageUrl}
        imageAlt={block.imageAlt}
        zoomable={block.zoomable === true}
      >
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
      </HotspotImageStage>
      {locked && <HotspotFeedbackList areas={block.areas} />}
    </div>
  );
}
