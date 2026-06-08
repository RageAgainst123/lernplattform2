'use client';

import { useRef, useState } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { zoneBoxStyle, zoneShapeClass } from '@/lib/blocks/hotspot-geometry';
import { LabelPopover } from './hotspot-label-popover';
import {
  DEFAULT_R,
  DEFAULT_RECT,
  MIN_DRAG,
  dragRect,
  relPos,
  type DragState,
} from './hotspot-editor-drag';

// Visueller Hotspot-Editor (Admin): Kreis per Klick, Rechteck per Aufziehen
// (mousedown → ziehen → loslassen). Relative Koordinaten 0–1 via
// getBoundingClientRect — identisch zum Renderer (gemeinsamer zoneBoxStyle).

type Area = HotspotBlock['areas'][number];

type Group = { id: string; label: string };

// Vorschau aller gesetzten Zonen + (während des Aufziehens) das gestrichelte
// Drag-Rechteck. Ausgelagert, damit HotspotImageEditor unter der Datei-Grenze
// bleibt. `colorForArea` liefert border+bg pro Zone.
function ZonePreviews({
  areas,
  drag,
  colorForArea,
}: {
  areas: Area[];
  drag: DragState | null;
  colorForArea: (a: Area) => string;
}) {
  return (
    <>
      {areas.map((a) => (
        <span
          key={a.id}
          style={zoneBoxStyle(a)}
          className={cn(
            'pointer-events-none absolute border-2',
            zoneShapeClass(a),
            colorForArea(a)
          )}
        />
      ))}
      {drag && (
        <span
          style={{
            // Verankert an der oberen linken Ecke (min der beiden Drag-Punkte),
            // damit das Rechteck vom Klickpunkt aus aufgezogen wird — kein
            // Wachsen aus der Mitte.
            left: `${Math.min(drag.x0, drag.x1) * 100}%`,
            top: `${Math.min(drag.y0, drag.y1) * 100}%`,
            width: `${Math.abs(drag.x1 - drag.x0) * 100}%`,
            height: `${Math.abs(drag.y1 - drag.y0) * 100}%`,
          }}
          className="border-primary bg-primary/20 pointer-events-none absolute rounded-md border-2 border-dashed"
        />
      )}
    </>
  );
}

// Klickbare/aufziehbare Bild-Fläche mit Vorschau aller gesetzten Zonen.
export function HotspotImageEditor({
  imageUrl,
  areas,
  drawShape,
  colorForArea,
  labelArea,
  groups,
  canAddGroup,
  onLabelSave,
  onLabelAssignGroup,
  onLabelCreateGroup,
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
  // Gruppen + Callbacks fürs Popup (Gruppe wählen / neue Gruppe anlegen).
  groups?: Group[];
  canAddGroup?: boolean;
  onLabelSave?: (label: string) => void;
  onLabelAssignGroup?: (groupId: string | undefined) => void;
  onLabelCreateGroup?: () => void;
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
      <ZonePreviews areas={areas} drag={drag} colorForArea={zoneColor} />
      {labelArea && onLabelSave && onLabelClose && (
        <LabelPopover
          area={labelArea}
          groups={groups}
          canAddGroup={canAddGroup}
          onSave={onLabelSave}
          onAssignGroup={onLabelAssignGroup}
          onCreateGroup={onLabelCreateGroup}
          onClose={onLabelClose}
        />
      )}
    </div>
  );
}

export { DEFAULT_R, DEFAULT_RECT };
