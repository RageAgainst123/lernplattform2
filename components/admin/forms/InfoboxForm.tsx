'use client';

import type { InfoboxBlock } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea, TextInput } from './form-helpers';

// Form-Editor für infobox (visuell hervorgehobener Hinweis-Kasten). Optional
// mit Titel.

type Props = {
  value: InfoboxBlock;
  onChange: (next: InfoboxBlock) => void;
};

export function InfoboxForm({ value, onChange }: Props) {
  const set = <K extends keyof InfoboxBlock>(key: K, v: InfoboxBlock[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-title`}>Titel</FieldLabel>
        <TextInput
          id={`${value.id}-title`}
          value={value.title ?? ''}
          onChange={(v) => set('title', v || undefined)}
          placeholder={'optional, z.B. „Wichtig:"'}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${value.id}-content`}>Inhalt</FieldLabel>
        <TextArea
          id={`${value.id}-content`}
          value={value.content}
          onChange={(v) => set('content', v)}
          placeholder="Der Hinweis-Text…"
          rows={4}
        />
      </div>
    </div>
  );
}
