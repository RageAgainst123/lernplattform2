'use client';

import { useRef, useState } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { hitAreaIds } from '@/lib/blocks/hotspot-geometry';

// Frei-Klick-Fläche für versteckte Zonen (revealZones=false): die Schüler:in
// sieht KEINE Rahmen, sondern klickt frei aufs Bild („Finde das Objekt").
//
// Anti-Raten-Design: jeder Klick setzt einen NEUTRALEN nummerierten Marker an
// die Klickposition — egal ob Treffer oder nicht. KEIN Live-Feedback (kein
// grün/rot), damit niemand herumklickt, bis es grün wird. Erst beim „Prüfen"
// (außerhalb dieser Komponente) werden die richtigen Zonen aufgedeckt. Optional
// begrenzt `maxClicks` die Anzahl der Klicks (z.B. = Anzahl richtiger Zonen).
//
// Die Klick-Positionen sind lokaler UI-State (für die neutrale Anzeige). Die
// ANTWORT bleibt das string[] der getroffenen areaIds.

type Area = HotspotBlockType['areas'][number];
type Pick = { x: number; y: number; areaId: string | null };

// Relative Klickposition (0–1) + Aspekt (Höhe/Breite) des angeklickten Bildes.
function relClick(e: React.PointerEvent<HTMLElement>, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  const aspect = rect.height > 0 ? rect.height / rect.width : 1;
  return { px, py, aspect };
}

function Markers({ picks }: { picks: Pick[] }) {
  return (
    <>
      {picks.map((p, i) => (
        <span
          key={i}
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          className="border-primary bg-primary/80 absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold text-white"
          aria-hidden
        >
          {i + 1}
        </span>
      ))}
    </>
  );
}

// Klick-Zähler unter dem Bild (nur bei gesetztem Limit).
function ClickCounter({ used, max }: { used: number; max: number }) {
  return (
    <p className="text-muted-foreground text-center text-sm">
      {used} / {max} Klicks gesetzt
      {used >= max && ' — Limit erreicht'}
    </p>
  );
}

type HiddenProps = {
  imageUrl: string;
  imageAlt?: string;
  zones: Area[];
  picked: Set<string>;
  locked: boolean;
  maxClicks?: number;
  onToggle: (id: string) => void;
};

// Klickbare Bild-Fläche mit neutralen Markern (keine Treffer-Anzeige).
export function HotspotHiddenSurface({
  imageUrl,
  imageAlt,
  zones,
  picked,
  locked,
  maxClicks,
  onToggle,
}: HiddenProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Lokale Klick-Positionen (neutrale Marker). Initial aus der Antwort: Zonen-
  // Mittelpunkte der bereits getroffenen Zonen (z.B. nach Reload).
  const [picks, setPicks] = useState<Pick[]>(() =>
    zones.filter((z) => picked.has(z.id)).map((z) => ({ x: z.x, y: z.y, areaId: z.id }))
  );
  const limitReached = maxClicks !== undefined && picks.length >= maxClicks;
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (locked || limitReached || !ref.current) return;
    const { px, py, aspect } = relClick(e, ref.current);
    const hit = hitAreaIds(zones, px, py, aspect)[0] ?? null;
    setPicks((prev) => [...prev, { x: px, y: py, areaId: hit }]);
    if (hit && !picked.has(hit)) onToggle(hit); // areaId in die Antwort aufnehmen
  }
  return (
    <div className="space-y-2">
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        role="button"
        tabIndex={0}
        aria-label="Klicke die gesuchten Stellen im Bild an"
        className="relative mx-auto w-full max-w-2xl cursor-crosshair touch-none overflow-hidden rounded-md border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Modul-Bilder aus Storage/Pexels */}
        <img
          src={imageUrl}
          alt={imageAlt ?? ''}
          className="block w-full select-none"
          draggable={false}
        />
        <Markers picks={picks} />
      </div>
      {maxClicks !== undefined && <ClickCounter used={picks.length} max={maxClicks} />}
    </div>
  );
}
