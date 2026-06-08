'use client';

import { useRef, useState } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { hitAreaIds } from '@/lib/blocks/hotspot-geometry';

// Frei-Klick-Fläche für versteckte Zonen (revealZones=false): die Schüler:in
// sieht KEINE Rahmen, sondern klickt frei aufs Bild. Ein Treffer zählt, wenn der
// Klick in einer Zone liegt (pointInArea via hitAreaIds). Gefundene Treffer
// erscheinen als kleine Häkchen-Punkte; ein Klick daneben als flüchtiger
// „Daneben“-Punkt (kein Antwort-Eintrag). Geteilt von Einfach- und Gruppen-Modus
// (zones = die für den aktuellen Schritt relevanten Zonen).

type Area = HotspotBlockType['areas'][number];

// Relative Klickposition (0–1) + Aspekt (Höhe/Breite) des angeklickten Bildes.
function relClick(e: React.PointerEvent<HTMLElement>, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  const aspect = rect.height > 0 ? rect.height / rect.width : 1;
  return { px, py, aspect };
}

type Miss = { x: number; y: number; key: number };

// Treffer-Häkchen an den Mittelpunkten der bereits gefundenen Zonen + flüchtiger
// „Daneben"-Punkt. Verrät keine Zonen-Grenzen (nur Punkt-Marker).
function HiddenMarkers({
  zones,
  picked,
  miss,
}: {
  zones: Area[];
  picked: Set<string>;
  miss: Miss | null;
}) {
  return (
    <>
      {zones
        .filter((z) => picked.has(z.id))
        .map((z) => (
          <span
            key={z.id}
            style={{ left: `${z.x * 100}%`, top: `${z.y * 100}%` }}
            className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-green-600 bg-green-500/80 text-xs text-white"
            aria-hidden
          >
            ✓
          </span>
        ))}
      {miss && (
        <span
          key={miss.key}
          style={{ left: `${miss.x * 100}%`, top: `${miss.y * 100}%` }}
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-red-500/70"
          aria-hidden
        />
      )}
    </>
  );
}

// Klickbare Bild-Fläche mit verstecktem Treffer-Test. `picked` = bereits
// gefundene areaIds; `onToggle` togglet eine getroffene Zone in die Antwort.
export function HotspotHiddenSurface({
  imageUrl,
  imageAlt,
  zones,
  picked,
  locked,
  onToggle,
}: {
  imageUrl: string;
  imageAlt?: string;
  zones: Area[];
  picked: Set<string>;
  locked: boolean;
  onToggle: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [miss, setMiss] = useState<Miss | null>(null);
  const missKey = useRef(0);
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (locked || !ref.current) return;
    const { px, py, aspect } = relClick(e, ref.current);
    const hits = hitAreaIds(zones, px, py, aspect);
    if (hits.length > 0) {
      onToggle(hits[0]);
      setMiss(null);
    } else {
      missKey.current += 1;
      setMiss({ x: px, y: py, key: missKey.current });
    }
  }
  return (
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
      <HiddenMarkers zones={zones} picked={picked} miss={miss} />
    </div>
  );
}
