'use client';

import type { HotspotBlock } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';
import { ItemAction, TextInput } from './form-helpers';

// Visueller Hotspot-Editor (Admin): Klick aufs Bild → neue Zone an relativer
// Position; Zonen-Liste mit Label, Radius-Slider, „richtig"-Haken, Löschen.
// Relative Koordinaten 0–1 via getBoundingClientRect — identisch zum Renderer.

type Area = HotspotBlock['areas'][number];
const DEFAULT_R = 0.08;

// Klickbare Bild-Fläche mit SVG-Vorschau der Zonen.
export function HotspotImageEditor({
  imageUrl,
  areas,
  onAddArea,
}: {
  imageUrl: string;
  areas: Area[];
  onAddArea: (x: number, y: number) => void;
}) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onAddArea(Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
  }
  return (
    <div
      onClick={handleClick}
      className="relative w-full cursor-crosshair overflow-hidden rounded-md border"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Editor-Vorschau */}
      <img src={imageUrl} alt="" className="block w-full select-none" draggable={false} />
      {areas.map((a) => (
        <span
          key={a.id}
          style={{
            left: `${a.x * 100}%`,
            top: `${a.y * 100}%`,
            width: `${a.r * 2 * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'pointer-events-none absolute aspect-square rounded-full border-2',
            a.isCorrect ? 'border-green-500 bg-green-400/25' : 'border-gray-400 bg-gray-400/20'
          )}
        />
      ))}
    </div>
  );
}

// Eine Zeile in der Zonen-Liste.
export function ZoneRow({
  area,
  index,
  onUpdate,
  onRemove,
}: {
  area: Area;
  index: number;
  onUpdate: (patch: Partial<Area>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      <span className="text-muted-foreground w-5 text-xs tabular-nums">{index + 1}.</span>
      <TextInput
        id={`zone-${area.id}-label`}
        value={area.label ?? ''}
        onChange={(v) => onUpdate({ label: v || undefined })}
        placeholder="Label (optional)"
      />
      <label className="flex items-center gap-1 text-xs">
        Größe
        <input
          type="range"
          min={0.02}
          max={0.5}
          step={0.01}
          value={area.r}
          onChange={(e) => onUpdate({ r: Number(e.target.value) })}
          aria-label={`Radius Zone ${index + 1}`}
        />
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={area.isCorrect}
          onChange={(e) => onUpdate({ isCorrect: e.target.checked })}
        />
        richtig
      </label>
      <ItemAction onClick={onRemove} label="✕" tone="destructive" />
    </li>
  );
}

export { DEFAULT_R };
