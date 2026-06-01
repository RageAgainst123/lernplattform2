'use client';

import type { ReflectionBlock } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea, TextInput } from './form-helpers';

// Form-Editor für reflection (Freitext-Antwort der Schüler:in). Keine
// automatische Bewertung — Lehrer:in liest die Antwort in der Abgabe-Detail.

type Props = {
  value: ReflectionBlock;
  onChange: (next: ReflectionBlock) => void;
};

export function ReflectionForm({ value, onChange }: Props) {
  const set = <K extends keyof ReflectionBlock>(key: K, v: ReflectionBlock[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-prompt`}>Frage / Schreibimpuls</FieldLabel>
        <TextArea
          id={`${value.id}-prompt`}
          value={value.prompt}
          onChange={(v) => set('prompt', v)}
          placeholder="Was hast du heute über das EVA-Prinzip gelernt?"
          rows={3}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${value.id}-ph`}>Platzhalter im Antwort-Feld</FieldLabel>
        <TextInput
          id={`${value.id}-ph`}
          value={value.placeholder ?? ''}
          onChange={(v) => set('placeholder', v || undefined)}
          placeholder={'optional, z.B. „Schreibe in eigenen Worten…"'}
        />
      </div>
    </div>
  );
}
