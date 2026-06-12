'use client';

import type { TextBlock } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea, TextInput } from './form-helpers';
import { ImageSourceBar } from './image-source-bar';

// Form-Editor für text (Theorie-Absatz). Optional ein Bild — per Upload/
// Pexels-Picker (V9, geteilte ImageSourceBar) oder als URL-Fallback.

type Props = {
  value: TextBlock;
  onChange: (next: TextBlock) => void;
};

export function TextForm({ value, onChange }: Props) {
  const set = <K extends keyof TextBlock>(key: K, v: TextBlock[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-content`}>Text</FieldLabel>
        <TextArea
          id={`${value.id}-content`}
          value={value.content}
          onChange={(v) => set('content', v)}
          placeholder="Erklärender Text für die Schüler:in…"
          rows={5}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor={`${value.id}-img`}>Bild (optional)</FieldLabel>
        {value.imageUrl ? (
          <div className="space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.imageUrl} alt="" className="max-h-40 rounded border object-contain" />
            <button
              type="button"
              onClick={() => set('imageUrl', undefined)}
              className="text-muted-foreground hover:text-foreground text-xs underline"
            >
              ✕ Bild entfernen
            </button>
          </div>
        ) : (
          <ImageSourceBar onPicked={(url) => set('imageUrl', url)} />
        )}
        <TextInput
          id={`${value.id}-img`}
          value={value.imageUrl ?? ''}
          onChange={(v) => set('imageUrl', v || undefined)}
          placeholder="oder Bild-URL einfügen, https://…"
        />
      </div>
    </div>
  );
}
