'use client';

import { useState } from 'react';
import type { LabelImageBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { FieldLabel, TextInput } from './form-helpers';
import { DEFAULT_R, HotspotImageEditor } from './hotspot-editor';
import { ImageSourceBar } from './image-source-bar';
import { RevealToggle, ShapeToggle, ZoomToggle, type HotspotShape } from './hotspot-toolbar';
import { LabelZoneList } from './label-image-zone-row';
import { addZone, removeZone, setZoneLabel, updateZone } from './label-image-form-ops';

// Admin-Editor für „Bild-Beschriften" (label_image). Bildquelle → Klick-Editor
// (Kreis/Rechteck) → Begriff-Popup je Zone → Zonen-Liste. Wie der Hotspot-Editor,
// aber jede Zone trägt genau einen Pflicht-Soll-Begriff (kein richtig/Gruppe).

type Props = { value: LabelImageBlock; onChange: (next: LabelImageBlock) => void };
type Zone = LabelImageBlock['zones'][number];

// Zonen im Editor neutral-blau einfärben (kein richtig/falsch — alle gleich).
const ZONE_COLOR = 'border-sky-500 bg-sky-400/20';

export function LabelImageForm({ value, onChange }: Props) {
  const [drawShape, setDrawShape] = useState<HotspotShape>('circle');
  // id der gerade gesetzten Zone → öffnet das Begriff-Popup direkt an der Zone.
  const [labelingId, setLabelingId] = useState<string | null>(null);

  function add(extra: Partial<Zone>) {
    const { next, id } = addZone(value, extra);
    onChange(next);
    setLabelingId(id);
  }
  const addCircle = (x: number, y: number) => add({ x, y, shape: 'circle', r: DEFAULT_R });
  const addRect = (x: number, y: number, width: number, height: number) =>
    add({ x, y, shape: 'rect', width, height });
  const updateZ = (i: number, patch: Partial<Zone>) => onChange(updateZone(value, i, patch));
  const removeZ = (i: number) => onChange(removeZone(value, i));

  const labelZone = labelingId ? (value.zones.find((z) => z.id === labelingId) ?? null) : null;
  function saveLabel(label: string) {
    if (!labelingId) return;
    onChange(setZoneLabel(value, labelingId, label));
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
          placeholder={'z.B. „Beschrifte die Teile des Computers."'}
        />
      </div>

      <ImageSourceBar onPicked={(url) => onChange({ ...value, imageUrl: url })} />

      {value.imageUrl ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <ShapeToggle shape={drawShape} onChange={setDrawShape} />
            <RevealToggle
              reveal={value.revealZones ?? true}
              onChange={(revealZones) => onChange({ ...value, revealZones })}
            />
            <ZoomToggle
              zoomable={value.zoomable === true}
              onChange={(zoomable) => onChange({ ...value, zoomable })}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            <strong>Kreis:</strong> ins Bild klicken. <strong>Rechteck:</strong> aufziehen. Danach
            poppt ein Feld auf, um den richtigen Begriff für diese Stelle einzutippen. „Verstecken“
            = die Schüler:in sieht keine Marker, sondern muss die Stelle erst frei anklicken. Größe
            und Drehung jeder Zone unten.
          </p>
          <HotspotImageEditor
            imageUrl={value.imageUrl}
            areas={value.zones}
            drawShape={drawShape}
            colorForArea={() => ZONE_COLOR}
            labelArea={labelZone}
            zoomable={value.zoomable === true}
            onLabelSave={saveLabel}
            onLabelClose={() => setLabelingId(null)}
            onAddCircle={addCircle}
            onAddRect={addRect}
          />
          <LabelZoneList
            zones={value.zones}
            onUpdate={updateZ}
            onRemove={removeZ}
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
