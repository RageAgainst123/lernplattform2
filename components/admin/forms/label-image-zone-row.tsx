'use client';

import type { LabelImageBlock } from '@/lib/schemas/blocks';
import { AddButton, ItemAction, TextInput } from './form-helpers';
import { ShapeSliders, Slider } from './hotspot-zone-controls';

// Eine Zeile in der Zonen-Liste des „Bild-Beschriften"-Editors: Pflicht-Begriff
// (Soll-Label), Form-Slider, Drehung, ×. Kein richtig/Gruppe/Feedback — jede
// Zone hat genau einen richtigen Begriff.

type Zone = LabelImageBlock['zones'][number];

export function LabelZoneRow({
  zone,
  index,
  onUpdate,
  onRemove,
}: {
  zone: Zone;
  index: number;
  onUpdate: (patch: Partial<Zone>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      <span className="text-muted-foreground w-5 text-xs tabular-nums">{index + 1}.</span>
      <TextInput
        id={`zone-${zone.id}-label`}
        value={zone.label}
        onChange={(v) => onUpdate({ label: v })}
        placeholder="Begriff (Pflicht), z.B. Maus"
      />
      <ShapeSliders area={zone} index={index} onUpdate={onUpdate} />
      <Slider
        label="Drehung"
        value={zone.rotation ?? 0}
        min={0}
        max={359}
        step={5}
        onChange={(v) => onUpdate({ rotation: v })}
        ariaLabel={`Drehung Zone ${index + 1}`}
      />
      <ItemAction onClick={onRemove} label="✕" tone="destructive" />
    </li>
  );
}

// Komplette Zonen-Liste + Leer-Aktion. Ausgelagert, damit LabelImageForm unter
// der Zeilen-Grenze bleibt.
export function LabelZoneList({
  zones,
  onUpdate,
  onRemove,
  onAddDefault,
}: {
  zones: Zone[];
  onUpdate: (index: number, patch: Partial<Zone>) => void;
  onRemove: (index: number) => void;
  onAddDefault: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium">Zonen &amp; Begriffe</div>
      <ul className="space-y-2">
        {zones.map((zone, i) => (
          <LabelZoneRow
            key={zone.id}
            zone={zone}
            index={i}
            onUpdate={(patch) => onUpdate(i, patch)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </ul>
      {zones.length === 0 && <AddButton onClick={onAddDefault}>Zone in der Mitte</AddButton>}
    </div>
  );
}
