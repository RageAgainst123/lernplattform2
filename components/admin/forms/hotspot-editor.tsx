'use client';

import { useRef, useState } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { zoneBoxStyle, zoneShapeClass } from '@/lib/blocks/hotspot-geometry';

// Visueller Hotspot-Editor (Admin): Kreis per Klick, Rechteck per Aufziehen
// (mousedown → ziehen → loslassen). Relative Koordinaten 0–1 via
// getBoundingClientRect — identisch zum Renderer (gemeinsamer zoneBoxStyle).

type Area = HotspotBlock['areas'][number];
const DEFAULT_R = 0.08;
const DEFAULT_RECT = { width: 0.2, height: 0.12 };
// Kleiner als das wird als „nur geklickt" (kein echtes Aufziehen) gewertet.
const MIN_DRAG = 0.03;

function relPos(e: { clientX: number; clientY: number }, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
}

// Live-Vorschau eines Rechtecks während des Aufziehens.
type DragState = { x0: number; y0: number; x1: number; y1: number };

function dragRect(d: DragState) {
  const x = (d.x0 + d.x1) / 2;
  const y = (d.y0 + d.y1) / 2;
  const width = Math.abs(d.x1 - d.x0);
  const height = Math.abs(d.y1 - d.y0);
  return { x, y, width, height };
}

// Klickbare/aufziehbare Bild-Fläche mit Vorschau aller gesetzten Zonen.
export function HotspotImageEditor({
  imageUrl,
  areas,
  drawShape,
  onAddCircle,
  onAddRect,
}: {
  imageUrl: string;
  areas: Area[];
  drawShape: 'circle' | 'rect';
  onAddCircle: (x: number, y: number) => void;
  onAddRect: (x: number, y: number, width: number, height: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const p = relPos(e, ref.current);
    if (drawShape === 'circle') {
      onAddCircle(p.x, p.y);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || !ref.current) return;
    const p = relPos(e, ref.current);
    setDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : d));
  }

  function onPointerUp() {
    if (!drag) return;
    const r = dragRect(drag);
    setDrag(null);
    // Zu kleines Ziehen → Default-Rechteck am Startpunkt (verhindert 0-Größe).
    if (r.width < MIN_DRAG || r.height < MIN_DRAG) {
      onAddRect(drag.x0, drag.y0, DEFAULT_RECT.width, DEFAULT_RECT.height);
    } else {
      onAddRect(
        Math.round(r.x * 1000) / 1000,
        Math.round(r.y * 1000) / 1000,
        Math.round(r.width * 1000) / 1000,
        Math.round(r.height * 1000) / 1000
      );
    }
  }

  const preview = drag ? dragRect(drag) : null;
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        'relative w-full touch-none overflow-hidden rounded-md border',
        drawShape === 'circle' ? 'cursor-crosshair' : 'cursor-cell'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Editor-Vorschau */}
      <img src={imageUrl} alt="" className="block w-full select-none" draggable={false} />
      {areas.map((a) => (
        <span
          key={a.id}
          style={zoneBoxStyle(a)}
          className={cn(
            'pointer-events-none absolute border-2',
            zoneShapeClass(a),
            a.isCorrect ? 'border-green-500 bg-green-400/25' : 'border-gray-400 bg-gray-400/20'
          )}
        />
      ))}
      {preview && (
        <span
          style={{
            left: `${preview.x * 100}%`,
            top: `${preview.y * 100}%`,
            width: `${preview.width * 100}%`,
            aspectRatio: `${preview.width || 0.01} / ${preview.height || 0.01}`,
            transform: 'translate(-50%, -50%)',
          }}
          className="border-primary bg-primary/20 pointer-events-none absolute rounded-md border-2 border-dashed"
        />
      )}
    </div>
  );
}

export { DEFAULT_R, DEFAULT_RECT };
