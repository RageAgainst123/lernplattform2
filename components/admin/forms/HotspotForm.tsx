'use client';

import { useRef, useState, useTransition } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { uploadHotspotImage } from '@/lib/db/hotspot-image-actions';
import { Button } from '@/components/ui/button';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { FieldLabel, TextInput, makeOptionId } from './form-helpers';
import { DEFAULT_R, HotspotImageEditor } from './hotspot-editor';
import { ZoneList } from './hotspot-zone-row';
import { HotspotPexelsPicker } from './hotspot-image-picker';
import {
  ActiveGroupSelect,
  NewZoneToggle,
  ShapeToggle,
  type HotspotShape,
} from './hotspot-toolbar';
import { HotspotGroupsEditor } from './hotspot-groups-editor';
import { hotspotGroupColor } from '@/lib/blocks/hotspot-geometry';

// Admin-Editor für hotspot. Bildquelle (Upload + Pexels) → Klick-Editor →
// Zonen-Liste. Relative Koordinaten 0–1, identisch zum Renderer.

type Props = {
  value: HotspotBlock;
  onChange: (next: HotspotBlock) => void;
};

// Bildquelle-Leiste: Upload-Button + Pexels-Button. Kapselt den Upload-Transition.
function ImageSourceBar({ onPicked }: { onPicked: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pexelsOpen, setPexelsOpen] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      try {
        const { url } = await uploadHotspotImage(file);
        onPicked(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.');
      }
    });
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          {pending ? 'Lädt hoch…' : '⬆ Bild hochladen'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setPexelsOpen(true)}>
          🔍 Pexels durchsuchen
        </Button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <HotspotPexelsPicker
        open={pexelsOpen}
        onClose={() => setPexelsOpen(false)}
        onPick={(url) => {
          onPicked(url);
          setPexelsOpen(false);
        }}
      />
    </div>
  );
}

// Border+bg-Klassen einer Zone im Editor: im Gruppen-Modus nach Gruppe
// (Farbpalette), sonst grün (richtig) / grau (Ablenker). Pure Helper, damit
// HotspotForm unter dem Komplexitäts-Limit bleibt.
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

  function addArea(extra: Partial<HotspotBlock['areas'][number]>) {
    const id = makeOptionId(value.areas, 'a');
    onChange({
      ...value,
      areas: [
        ...value.areas,
        {
          id,
          rotation: 0,
          isCorrect: newIsCorrect,
          groupId: newGroupId,
          ...extra,
        } as HotspotBlock['areas'][number],
      ],
    });
    // Direkt nach dem Setzen das Label-Popup an der neuen Zone öffnen.
    setLabelingId(id);
  }

  function addCircle(x: number, y: number) {
    addArea({ x, y, shape: 'circle', r: DEFAULT_R });
  }

  function addRect(x: number, y: number, width: number, height: number) {
    addArea({ x, y, shape: 'rect', width, height });
  }
  function updateArea(i: number, patch: Partial<HotspotBlock['areas'][number]>) {
    onChange({
      ...value,
      areas: value.areas.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    });
  }
  function removeArea(i: number) {
    if (value.areas.length <= 1) return;
    onChange({ ...value, areas: value.areas.filter((_, idx) => idx !== i) });
  }

  // Zone, für die das Label-Popup gerade offen ist (oder null).
  const labelArea = labelingId ? (value.areas.find((a) => a.id === labelingId) ?? null) : null;

  function saveLabel(label: string) {
    if (!labelingId) return;
    onChange({
      ...value,
      areas: value.areas.map((a) =>
        a.id === labelingId ? { ...a, label: label || undefined } : a
      ),
    });
    setLabelingId(null);
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
            <ActiveGroupSelect
              groups={groups}
              value={currentGroupId}
              onChange={setCurrentGroupId}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            <strong>Kreis:</strong> ins Bild klicken. <strong>Rechteck:</strong> aufziehen. Danach
            poppt ein Feld auf, um die Zone zu beschriften. Größe/Drehung/„richtig“ bei jeder Zone
            unten.
          </p>
          <HotspotImageEditor
            imageUrl={value.imageUrl}
            areas={value.areas}
            drawShape={drawShape}
            colorForArea={colorForArea}
            labelArea={labelArea}
            onLabelSave={saveLabel}
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
