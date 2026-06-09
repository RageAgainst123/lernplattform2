'use client';

import { useState, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

// Zoom-/Pan-Rahmen für Hotspot-Bilder (zoomable=true). Skaliert einen inneren
// Wrapper per CSS-`scale`; Pan = natives Scrollen im overflow-auto-Viewport.
//
// WICHTIG: Bild UND Zonen-Overlays liegen GEMEINSAM im skalierten Wrapper.
// Der Klick-/Zeichen-Code misst `getBoundingClientRect()` dieses Wrappers
// (via `innerRef`) — dessen rect spiegelt Skalierung + Scroll bereits wider,
// daher bleibt die 0–1-Koordinaten-Mathematik unverändert (kein Zoom-Faktor
// im relPos/relClick nötig).

const STEPS = [1, 1.5, 2, 3] as const;

// Zoom-Steuerung: −, Faktor-Anzeige, +, Reset.
function ZoomControls({
  scale,
  onZoom,
  onReset,
}: {
  scale: number;
  onZoom: (dir: 1 | -1) => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-background/90 absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onZoom(-1)}
        disabled={scale <= STEPS[0]}
        aria-label="Verkleinern"
        className="hover:bg-muted size-7 rounded text-lg leading-none disabled:opacity-40"
      >
        −
      </button>
      <span className="w-9 text-center text-xs tabular-nums">{scale.toFixed(1)}×</span>
      <button
        type="button"
        onClick={() => onZoom(1)}
        disabled={scale >= STEPS[STEPS.length - 1]}
        aria-label="Vergrößern"
        className="hover:bg-muted size-7 rounded text-lg leading-none disabled:opacity-40"
      >
        +
      </button>
      {scale > 1 && (
        <button
          type="button"
          onClick={onReset}
          aria-label="Zoom zurücksetzen"
          className="hover:bg-muted ml-1 rounded px-2 text-xs"
        >
          Reset
        </button>
      )}
    </div>
  );
}

// Bild-Bühne für die SICHTBAREN Renderer (Zonen als Overlay über dem Bild).
// Kapselt das mx-auto-max-w-2xl-Layout + optionalen Zoom. `children` = die
// Zonen-Overlays. (Die Frei-Klick-Fläche nutzt diese Bühne NICHT — sie braucht
// einen eigenen Klick-Handler und liegt in hotspot-hidden.tsx.)
export function HotspotImageStage({
  imageUrl,
  imageAlt,
  zoomable,
  children,
}: {
  imageUrl: string;
  imageAlt?: string;
  zoomable: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ZoomImageFrame
        enabled={zoomable}
        innerClassName="relative overflow-hidden rounded-md border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Modul-Bilder aus Storage/Pexels */}
        <img src={imageUrl} alt={imageAlt ?? ''} className="block w-full" />
        {children}
      </ZoomImageFrame>
    </div>
  );
}

// `enabled=false` → reicht children unverändert durch (Bestandsverhalten, ein
// einfacher relativer Container). `enabled=true` → Zoom-Viewport + Controls.
// `innerRef`/`innerProps` werden an den skalierten Wrapper (= Mess-/Klickfläche)
// durchgereicht.
export function ZoomImageFrame({
  enabled,
  children,
  innerRef,
  innerClassName,
  innerProps,
}: {
  enabled: boolean;
  children: ReactNode;
  innerRef?: Ref<HTMLDivElement>;
  innerClassName?: string;
  innerProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [scale, setScale] = useState(1);
  if (!enabled) {
    return (
      <div ref={innerRef} className={innerClassName} {...innerProps}>
        {children}
      </div>
    );
  }
  const onZoom = (dir: 1 | -1) => {
    setScale((s) => {
      const i = STEPS.indexOf(s as (typeof STEPS)[number]);
      const next = i === -1 ? 1 : STEPS[Math.min(STEPS.length - 1, Math.max(0, i + dir))];
      return next;
    });
  };
  return (
    <div className="relative">
      <div className="max-h-[70vh] overflow-auto rounded-md border">
        <div
          ref={innerRef}
          className={cn('relative w-full origin-top-left', innerClassName)}
          style={{ width: `${scale * 100}%` }}
          {...innerProps}
        >
          {children}
        </div>
      </div>
      <ZoomControls scale={scale} onZoom={onZoom} onReset={() => setScale(1)} />
    </div>
  );
}
