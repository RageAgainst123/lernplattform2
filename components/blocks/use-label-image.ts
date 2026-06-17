'use client';

import { useRef, useState } from 'react';
import type { LabelImageBlock as LabelImageBlockType } from '@/lib/schemas/blocks';
import { hitAreaIds } from '@/lib/blocks/hotspot-geometry';

// State + Handler für „Bild-Beschriften", ausgelagert aus LabelImageBlock
// (Funktions-Zeilen-Grenze). Liefert aktive Zone, Pool-Begriffe, die
// Klick-Fläche-Ref und alle Aktionen.

type Block = LabelImageBlockType;
type Assignment = Record<string, string>;

function relClick(e: React.PointerEvent<HTMLElement>, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return {
    px: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    py: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    aspect: r.height > 0 ? r.height / r.width : 1,
  };
}

export function useLabelImage(
  block: Block,
  assignment: Assignment,
  locked: boolean,
  onAssign: (next: Assignment) => void
) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const usedLabels = new Set(Object.values(assignment));
  const poolLabels = block.zones.map((z) => z.label).filter((l) => !usedLabels.has(l));
  const activeIndex = block.zones.findIndex((z) => z.id === activeZone);
  const activeHint = activeZone ? `Stelle ${activeIndex + 1}` : null;

  function selectZone(id: string) {
    if (!locked) setActiveZone((cur) => (cur === id ? null : id));
  }
  function pickLabel(label: string) {
    if (!activeZone) return;
    onAssign({ ...assignment, [activeZone]: label });
    setActiveZone(null);
  }
  function unassign(zoneId: string) {
    const next = { ...assignment };
    delete next[zoneId];
    onAssign(next);
  }
  function onFreeClick(e: React.PointerEvent<HTMLDivElement>) {
    if (locked || !ref.current) return;
    const { px, py, aspect } = relClick(e, ref.current);
    setActiveZone(hitAreaIds(block.zones, px, py, aspect)[0] ?? null);
  }

  return { activeZone, poolLabels, activeHint, ref, selectZone, pickLabel, unassign, onFreeClick };
}
