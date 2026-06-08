'use client';

import type { HotspotBlock } from '@/lib/schemas/blocks';
import { AddButton, ItemAction, TextInput } from './form-helpers';

// Eine Zeile in der Zonen-Liste des Hotspot-Editors. Form-abhängig: Kreis zeigt
// einen Radius-Slider, Rechteck Breite + Höhe. Beide Formen haben einen
// Rotations-Slider. Die Slider sind auch der Touch-Fallback fürs Feintuning
// (Aufziehen ist am Desktop, hier kann man exakt nachjustieren).

type Area = HotspotBlock['areas'][number];

function Slider({
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

type Group = { id: string; label: string };

function GroupSelect({
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

export function ZoneRow({
  area,
  index,
  groups,
  onUpdate,
  onRemove,
}: {
  area: Area;
  index: number;
  groups?: Group[];
  onUpdate: (patch: Partial<Area>) => void;
  onRemove: () => void;
}) {
  const shape = area.shape ?? 'circle';
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      <span className="text-muted-foreground w-5 text-xs tabular-nums">{index + 1}.</span>
      <TextInput
        id={`zone-${area.id}-label`}
        value={area.label ?? ''}
        onChange={(v) => onUpdate({ label: v || undefined })}
        placeholder="Label (optional)"
      />
      {shape === 'rect' ? (
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
      ) : (
        <Slider
          label="Größe"
          value={area.r ?? 0.08}
          min={0.02}
          max={0.5}
          step={0.01}
          onChange={(v) => onUpdate({ r: v })}
          ariaLabel={`Radius Zone ${index + 1}`}
        />
      )}
      <Slider
        label="Drehung"
        value={area.rotation ?? 0}
        min={0}
        max={359}
        step={5}
        onChange={(v) => onUpdate({ rotation: v })}
        ariaLabel={`Drehung Zone ${index + 1}`}
      />
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={area.isCorrect}
          onChange={(e) => onUpdate({ isCorrect: e.target.checked })}
        />
        richtig
      </label>
      {groups && groups.length > 0 && (
        <GroupSelect
          groups={groups}
          value={area.groupId}
          index={index}
          onChange={(groupId) => onUpdate({ groupId })}
        />
      )}
      <ItemAction onClick={onRemove} label="✕" tone="destructive" />
    </li>
  );
}

// Komplette Zonen-Liste + Leer-Aktion. Ausgelagert, damit HotspotForm unter der
// Zeilen-Grenze bleibt.
export function ZoneList({
  areas,
  groups,
  onUpdate,
  onRemove,
  onAddDefault,
}: {
  areas: Area[];
  groups?: { id: string; label: string }[];
  onUpdate: (index: number, patch: Partial<Area>) => void;
  onRemove: (index: number) => void;
  onAddDefault: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium">Zonen</div>
      <ul className="space-y-2">
        {areas.map((area, i) => (
          <ZoneRow
            key={area.id}
            area={area}
            index={i}
            groups={groups}
            onUpdate={(patch) => onUpdate(i, patch)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </ul>
      {areas.length === 0 && <AddButton onClick={onAddDefault}>Zone in der Mitte</AddButton>}
    </div>
  );
}
