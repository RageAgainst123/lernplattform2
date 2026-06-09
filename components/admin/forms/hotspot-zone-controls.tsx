'use client';

import type { HotspotBlock } from '@/lib/schemas/blocks';

// Steuerelemente einer Zonen-Zeile (Slider, Gruppen-Select, Form-abhängige
// Größen-Slider). Ausgelagert aus hotspot-zone-row.tsx wegen der Zeilen-Grenze.

type Area = HotspotBlock['areas'][number];
type Group = { id: string; label: string };

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <label className="flex items-center gap-1 text-xs">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
      />
    </label>
  );
}

export function GroupSelect({
  groups,
  value,
  index,
  onChange,
}: {
  groups: Group[];
  value: string | undefined;
  index: number;
  onChange: (groupId: string | undefined) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      aria-label={`Gruppe Zone ${index + 1}`}
      className="border-input bg-background h-7 rounded-md border px-1 text-xs"
    >
      <option value="">– ohne –</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.label}
        </option>
      ))}
    </select>
  );
}

// Form-abhängige Größen-Slider: Rechteck = Breite + Höhe, Kreis = Radius.
export function ShapeSliders({
  area,
  index,
  onUpdate,
}: {
  area: Area;
  index: number;
  onUpdate: (patch: Partial<Area>) => void;
}) {
  if ((area.shape ?? 'circle') === 'rect') {
    return (
      <>
        <Slider
          label="Breite"
          value={area.width ?? 0.2}
          min={0.04}
          max={1}
          step={0.01}
          onChange={(v) => onUpdate({ width: v })}
          ariaLabel={`Breite Zone ${index + 1}`}
        />
        <Slider
          label="Höhe"
          value={area.height ?? 0.12}
          min={0.04}
          max={1}
          step={0.01}
          onChange={(v) => onUpdate({ height: v })}
          ariaLabel={`Höhe Zone ${index + 1}`}
        />
      </>
    );
  }
  return (
    <Slider
      label="Größe"
      value={area.r ?? 0.08}
      min={0.02}
      max={0.5}
      step={0.01}
      onChange={(v) => onUpdate({ r: v })}
      ariaLabel={`Radius Zone ${index + 1}`}
    />
  );
}
