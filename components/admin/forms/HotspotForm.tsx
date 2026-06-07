'use client';

import { useRef, useState, useTransition } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { uploadHotspotImage } from '@/lib/db/hotspot-image-actions';
import { Button } from '@/components/ui/button';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { AddButton, FieldLabel, TextInput, makeOptionId } from './form-helpers';
import { DEFAULT_R, HotspotImageEditor, ZoneRow } from './hotspot-editor';
import { HotspotPexelsPicker } from './hotspot-image-picker';

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
  function addArea(x: number, y: number) {
    onChange({
      ...value,
      areas: [
        ...value.areas,
        { id: makeOptionId(value.areas, 'a'), x, y, r: DEFAULT_R, isCorrect: false },
      ],
    });
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
          <p className="text-muted-foreground text-xs">
            Klick ins Bild, um eine Zone zu setzen. Grün = richtig, grau = Ablenker.
          </p>
          <HotspotImageEditor imageUrl={value.imageUrl} areas={value.areas} onAddArea={addArea} />
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
                  onUpdate={(patch) => updateArea(i, patch)}
                  onRemove={() => removeArea(i)}
                />
              ))}
            </ul>
            {value.areas.length === 0 && (
              <AddButton onClick={() => addArea(0.5, 0.5)}>Zone in der Mitte</AddButton>
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
