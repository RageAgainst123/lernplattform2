'use client';

import { useState } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { FieldLabel, TextInput } from './form-helpers';
import { DEFAULT_R, HotspotImageEditor } from './hotspot-editor';
import { ZoneList } from './hotspot-zone-row';
import { ImageSourceBar } from './image-source-bar';
import {
  addArea,
  createGroupForArea,
  removeArea as opRemoveArea,
  setAreaGroup,
  setAreaLabel,
  updateArea as opUpdateArea,
} from './hotspot-form-ops';
import {
  ActiveGroupSelect,
  MaxClicksField,
  NewZoneToggle,
  RevealToggle,
  ShapeToggle,
  ZoomToggle,
  type HotspotShape,
} from './hotspot-toolbar';
import { HotspotGroupsEditor } from './hotspot-groups-editor';
import { HOTSPOT_GROUP_COUNT, hotspotGroupColor } from '@/lib/blocks/hotspot-geometry';

// Admin-Editor für hotspot. Bildquelle (Upload + Pexels) → Klick-Editor →
// Zonen-Liste. Relative Koordinaten 0–1, identisch zum Renderer.

type Props = {
  value: HotspotBlock;
  onChange: (next: HotspotBlock) => void;
};

// Border+bg-Klassen einer Zone im Editor: Gruppen-Modus = Gruppenfarbe, sonst
// grün (richtig) / grau (Ablenker). Pure Helper (Komplexitäts-Limit).
function zoneEditorColor(
  a: HotspotBlock['areas'][number],
  groups: NonNullable<HotspotBlock['groups']>
): string {
  if (groups.length > 0) {
    if (a.groupId === undefined) return 'border-gray-300 bg-gray-300/20';
    const idx = groups.findIndex((g) => g.id === a.groupId);
    return hotspotGroupColor(idx < 0 ? 0 : idx);
  }
  return a.isCorrect ? 'border-green-500 bg-green-400/25' : 'border-gray-400 bg-gray-400/20';
}

export function HotspotForm({ value, onChange }: Props) {
  // Bestimmt, ob die NÄCHSTE per Klick gesetzte Zone richtig (grün) oder ein
  // Ablenker (grau) ist. Default „richtig", weil jede Hotspot-Aufgabe mindestens
  // eine Lösung braucht (alter Bug: neue Zonen waren immer grau → wirkte, als
  // sei die erste Zone fix die einzige Lösung).
  const [newIsCorrect, setNewIsCorrect] = useState(true);
  const [drawShape, setDrawShape] = useState<HotspotShape>('circle');
  // Im Gruppen-Modus: in welche Gruppe landen neue Zonen? (Default erste Gruppe)
  const [currentGroupId, setCurrentGroupId] = useState<string | undefined>(value.groups?.[0]?.id);
  // id der gerade gesetzten Zone → öffnet das Label-Popup direkt an der Zone.
  const [labelingId, setLabelingId] = useState<string | null>(null);

  const groups = value.groups ?? [];
  const grouped = groups.length > 0;
  // groupId für neue Zonen: im Gruppen-Modus die aktive Gruppe, sonst keine.
  const newGroupId = grouped ? currentGroupId : undefined;
  const colorForArea = (a: HotspotBlock['areas'][number]) => zoneEditorColor(a, groups);

  function add(extra: Partial<HotspotBlock['areas'][number]>) {
    const { next, id } = addArea(value, { isCorrect: newIsCorrect, groupId: newGroupId }, extra);
    onChange(next);
    setLabelingId(id); // direkt das Label-Popup an der neuen Zone öffnen
  }
  const addCircle = (x: number, y: number) => add({ x, y, shape: 'circle', r: DEFAULT_R });
  const addRect = (x: number, y: number, width: number, height: number) =>
    add({ x, y, shape: 'rect', width, height });
  const updateArea = (i: number, patch: Partial<HotspotBlock['areas'][number]>) =>
    onChange(opUpdateArea(value, i, patch));
  const removeArea = (i: number) => onChange(opRemoveArea(value, i));

  // Zone, für die das Label-Popup gerade offen ist (oder null).
  const labelArea = labelingId ? (value.areas.find((a) => a.id === labelingId) ?? null) : null;

  function saveLabel(label: string) {
    if (!labelingId) return;
    onChange(setAreaLabel(value, labelingId, label));
    setLabelingId(null);
  }
  // Vom Popup: Zone einer Gruppe zuordnen (wirkt sofort, unabhängig vom Label).
  const assignLabelGroup = (groupId: string | undefined) => {
    if (labelingId) onChange(setAreaGroup(value, labelingId, groupId));
  };
  // Vom Popup „＋ Neue Gruppe": Gruppe anlegen + Zone zuordnen + aktiv setzen.
  function createGroupForLabel() {
    if (!labelingId) return;
    const res = createGroupForArea(value, labelingId);
    if (!res) return;
    setCurrentGroupId(res.groupId);
    onChange(res.next);
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-instruction`}>Aufgabenstellung</FieldLabel>
        <TextInput
          id={`${value.id}-instruction`}
          value={value.instruction}
          onChange={(v) => onChange({ ...value, instruction: v })}
          placeholder={'z.B. „Tippe alle Eingabegeräte im Bild an."'}
        />
      </div>

      <ImageSourceBar onPicked={(url) => onChange({ ...value, imageUrl: url })} />

      {value.imageUrl ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <NewZoneToggle isCorrect={newIsCorrect} onChange={setNewIsCorrect} />
            <ShapeToggle shape={drawShape} onChange={setDrawShape} />
            <RevealToggle
              reveal={value.revealZones ?? true}
              onChange={(revealZones) => onChange({ ...value, revealZones })}
            />
            <ActiveGroupSelect
              groups={groups}
              value={currentGroupId}
              onChange={setCurrentGroupId}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            <strong>Kreis:</strong> ins Bild klicken. <strong>Rechteck:</strong> aufziehen. Danach
            poppt ein Feld auf, um die Zone zu beschriften (dort auch Gruppe wählen). „Verstecken“ =
            Schüler:in sucht & klickt frei aufs Bild (neutrale Marker, Auflösung erst beim Prüfen).
            Größe/Drehung/„richtig“ bei jeder Zone unten.
          </p>
          {value.revealZones === false && (
            <MaxClicksField
              value={value.maxClicks}
              correctCount={value.areas.filter((a) => a.isCorrect).length}
              onChange={(maxClicks) => onChange({ ...value, maxClicks })}
            />
          )}
          <ZoomToggle
            zoomable={value.zoomable === true}
            onChange={(zoomable) => onChange({ ...value, zoomable })}
          />
          <HotspotImageEditor
            imageUrl={value.imageUrl}
            areas={value.areas}
            drawShape={drawShape}
            colorForArea={colorForArea}
            labelArea={labelArea}
            groups={groups}
            canAddGroup={groups.length < HOTSPOT_GROUP_COUNT}
            zoomable={value.zoomable === true}
            onLabelSave={saveLabel}
            onLabelAssignGroup={assignLabelGroup}
            onLabelCreateGroup={createGroupForLabel}
            onLabelClose={() => setLabelingId(null)}
            onAddCircle={addCircle}
            onAddRect={addRect}
          />
          <HotspotGroupsEditor
            value={value}
            currentGroupId={currentGroupId}
            onCurrentGroupChange={setCurrentGroupId}
            onChange={onChange}
          />
          <ZoneList
            areas={value.areas}
            groups={value.groups}
            onUpdate={updateArea}
            onRemove={removeArea}
            onAddDefault={() => addCircle(0.5, 0.5)}
          />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Lade zuerst ein Bild hoch oder suche eines über Pexels.
        </p>
      )}

      <GradedExtensionsFields
        blockId={value.id}
        hint={value.hint}
        maxAttempts={value.maxAttempts}
        category={value.category}
        onChange={(patch) => onChange({ ...value, ...patch })}
      />
    </div>
  );
}
