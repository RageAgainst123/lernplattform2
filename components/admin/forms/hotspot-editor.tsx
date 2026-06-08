'use client';

import { useRef, useState } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

// Kleines Label-Popup direkt an einer gerade gesetzten Zone. Autofokus,
// Enter speichert, Esc/Abbrechen schließt (ohne Label). Wird über dem Bild
// positioniert (x,y = Mittelpunkt der Zone in %).
function LabelPopover({
  area,
  onSave,
  onClose,
}: {
  area: Area;
  onSave: (label: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(area.label ?? '');
  // Horizontal an den Rändern einfangen, damit das Popup im Bild bleibt.
  const left = Math.min(82, Math.max(18, area.x * 100));
  // Bei Zonen im oberen Drittel das Popup UNTER die Zone klappen (sonst würde es
  // vom overflow-hidden-Container oben abgeschnitten); sonst darüber.
  const below = area.y < 0.3;
  const top = area.y * 100;
  const transform = below ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))';
  return (
    <div
      style={{ left: `${left}%`, top: `${top}%`, transform }}
      className="bg-background absolute z-10 w-56 rounded-md border p-2 shadow-lg"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="text-muted-foreground mb-1 text-xs">Was ist das? (Label)</p>
      <input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(text.trim());
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        placeholder="z.B. Laptop"
        className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
      />
      <div className="mt-2 flex justify-end gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="button" size="sm" onClick={() => onSave(text.trim())}>
          OK
        </Button>
      </div>
    </div>
  );
}

// Klickbare/aufziehbare Bild-Fläche mit Vorschau aller gesetzten Zonen.
export function HotspotImageEditor({
  imageUrl,
  areas,
  drawShape,
  colorForArea,
  labelArea,
  onLabelSave,
  onLabelClose,
  onAddCircle,
  onAddRect,
}: {
  imageUrl: string;
  areas: Area[];
  drawShape: 'circle' | 'rect';
  // Border+bg-Klassen pro Zone. Default: grün (richtig) / grau (Ablenker).
  // Im Gruppen-Modus liefert HotspotForm hier die Gruppenfarbe.
  colorForArea?: (area: Area) => string;
  // Zone, für die gerade das Label-Popup offen ist (direkt nach dem Setzen).
  labelArea?: Area | null;
  onLabelSave?: (label: string) => void;
  onLabelClose?: () => void;
  onAddCircle: (x: number, y: number) => void;
  onAddRect: (x: number, y: number, width: number, height: number) => void;
}) {
  const zoneColor =
    colorForArea ??
    ((a: Area) =>
      a.isCorrect ? 'border-green-500 bg-green-400/25' : 'border-gray-400 bg-gray-400/20');
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
          className={cn('pointer-events-none absolute border-2', zoneShapeClass(a), zoneColor(a))}
        />
      ))}
      {drag && (
        <span
          style={{
            // Verankert an der oberen linken Ecke (min der beiden Drag-Punkte),
            // damit das Rechteck beim Ziehen vom Klickpunkt aus aufgezogen wird
            // — wie in Grafikprogrammen, kein Wachsen aus der Mitte.
            left: `${Math.min(drag.x0, drag.x1) * 100}%`,
            top: `${Math.min(drag.y0, drag.y1) * 100}%`,
            width: `${Math.abs(drag.x1 - drag.x0) * 100}%`,
            height: `${Math.abs(drag.y1 - drag.y0) * 100}%`,
          }}
          className="border-primary bg-primary/20 pointer-events-none absolute rounded-md border-2 border-dashed"
        />
      )}
      {labelArea && onLabelSave && onLabelClose && (
        <LabelPopover area={labelArea} onSave={onLabelSave} onClose={onLabelClose} />
      )}
    </div>
  );
}

export { DEFAULT_R, DEFAULT_RECT };
