'use client';

import type { HotspotBlock } from '@/lib/schemas/blocks';
import { AddButton, ItemAction, TextInput } from './form-helpers';
import { GroupSelect, ShapeSliders, Slider } from './hotspot-zone-controls';

// Eine Zeile in der Zonen-Liste des Hotspot-Editors: Label, Form-Slider,
// Drehung, richtig-Checkbox, Gruppen-Select + optionaler Feedback-Text. Die
// Slider sind der Touch-Fallback fürs Feintuning (Aufziehen ist am Desktop).

type Area = HotspotBlock['areas'][number];
type Group = { id: string; label: string };

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
  return (
    <li className="flex flex-col gap-2 rounded-md border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-5 text-xs tabular-nums">{index + 1}.</span>
        <TextInput
          id={`zone-${area.id}-label`}
          value={area.label ?? ''}
          onChange={(v) => onUpdate({ label: v || undefined })}
          placeholder="Label (optional)"
        />
        <ShapeSliders area={area} index={index} onUpdate={onUpdate} />
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
      </div>
      <TextInput
        id={`zone-${area.id}-feedback`}
        value={area.feedback ?? ''}
        onChange={(v) => onUpdate({ feedback: v || undefined })}
        placeholder="Feedback nach dem Prüfen (optional, z.B. „Maus = Eingabegerät“)"
      />
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
