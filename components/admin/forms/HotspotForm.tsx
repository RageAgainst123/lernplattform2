'use client';

import { useRef, useState, useTransition } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { uploadHotspotImage } from '@/lib/db/hotspot-image-actions';
import { Button } from '@/components/ui/button';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { AddButton, FieldLabel, TextInput, makeOptionId } from './form-helpers';
import { DEFAULT_R, HotspotImageEditor } from './hotspot-editor';
import { ZoneRow } from './hotspot-zone-row';
import { HotspotPexelsPicker } from './hotspot-image-picker';
import { NewZoneToggle, ShapeToggle, type HotspotShape } from './hotspot-toolbar';
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

export function HotspotForm({ value, onChange }: Props) {
  // Bestimmt, ob die NÄCHSTE per Klick gesetzte Zone richtig (grün) oder ein
  // Ablenker (grau) ist. Default „richtig", weil jede Hotspot-Aufgabe mindestens
  // eine Lösung braucht (alter Bug: neue Zonen waren immer grau → wirkte, als
  // sei die erste Zone fix die einzige Lösung).
  const [newIsCorrect, setNewIsCorrect] = useState(true);
  const [drawShape, setDrawShape] = useState<HotspotShape>('circle');
  // Im Gruppen-Modus: in welche Gruppe landen neue Zonen? (Default erste Gruppe)
  const [currentGroupId, setCurrentGroupId] = useState<string | undefined>(value.groups?.[0]?.id);

  const groups = value.groups ?? [];
  const grouped = groups.length > 0;
  // groupId für neue Zonen: im Gruppen-Modus die aktive Gruppe, sonst keine.
  const newGroupId = grouped ? currentGroupId : undefined;

  // Index jeder Gruppe (für die Farbpalette).
  const groupIndex = new Map(groups.map((g, i) => [g.id, i]));

  // Zonen-Farbe im Editor: im Gruppen-Modus nach Gruppe, sonst grün/grau.
  function colorForArea(a: HotspotBlock['areas'][number]): string {
    if (grouped && a.groupId !== undefined) {
      return hotspotGroupColor(groupIndex.get(a.groupId) ?? 0);
    }
    if (grouped) return 'border-gray-300 bg-gray-300/20'; // gruppenlos
    return a.isCorrect ? 'border-green-500 bg-green-400/25' : 'border-gray-400 bg-gray-400/20';
  }

  function addArea(extra: Partial<HotspotBlock['areas'][number]>) {
    onChange({
      ...value,
      areas: [
        ...value.areas,
        {
          id: makeOptionId(value.areas, 'a'),
          rotation: 0,
          isCorrect: newIsCorrect,
          groupId: newGroupId,
          ...extra,
        } as HotspotBlock['areas'][number],
      ],
    });
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
            {grouped && (
              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Neue Zone in Gruppe:</span>
                <select
                  value={currentGroupId ?? ''}
                  onChange={(e) => setCurrentGroupId(e.target.value || undefined)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm font-medium"
                >
                  {groups.map((g, i) => (
                    <option key={g.id} value={g.id}>
                      {i + 1}. {g.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            Stelle oben Form und „richtig/Ablenker“ ein. <strong>Kreis:</strong> ins Bild klicken.{' '}
            <strong>Rechteck:</strong> mit gedrückter Maustaste aufziehen. Du kannst mehrere
            richtige Zonen setzen (z.B. „tippe alle Eingabegeräte an“). Größe, Drehung und „richtig“
            lassen sich bei jeder Zone unten nachjustieren.
          </p>
          <HotspotImageEditor
            imageUrl={value.imageUrl}
            areas={value.areas}
            drawShape={drawShape}
            colorForArea={colorForArea}
            onAddCircle={addCircle}
            onAddRect={addRect}
          />
          <HotspotGroupsEditor
            value={value}
            currentGroupId={currentGroupId}
            onCurrentGroupChange={setCurrentGroupId}
            onChange={onChange}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium">Zonen</span>
            </div>
            <ul className="space-y-2">
              {value.areas.map((area, i) => (
                <ZoneRow
                  key={area.id}
                  area={area}
                  index={i}
                  groups={value.groups}
                  onUpdate={(patch) => updateArea(i, patch)}
                  onRemove={() => removeArea(i)}
                />
              ))}
            </ul>
            {value.areas.length === 0 && (
              <AddButton onClick={() => addCircle(0.5, 0.5)}>Zone in der Mitte</AddButton>
            )}
          </div>
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
