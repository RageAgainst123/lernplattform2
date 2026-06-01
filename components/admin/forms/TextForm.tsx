'use client';

import type { TextBlock } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea, TextInput } from './form-helpers';

// Form-Editor für text (Theorie-Absatz). Optional ein Bild via URL.

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
      <div>
        <FieldLabel htmlFor={`${value.id}-img`}>Bild-URL</FieldLabel>
        <TextInput
          id={`${value.id}-img`}
          value={value.imageUrl ?? ''}
          onChange={(v) => set('imageUrl', v || undefined)}
          placeholder="optional, https://…"
        />
      </div>
    </div>
  );
}
