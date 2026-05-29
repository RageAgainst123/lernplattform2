'use client';

import type { ReflectionBlock as ReflectionBlockType } from '@/lib/schemas/blocks';

type Props = {
  block: ReflectionBlockType;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
};

export function ReflectionBlock({ block, value, readOnly = false, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-lg leading-relaxed">{block.prompt}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        placeholder={block.placeholder ?? 'Schreibe deine Antwort hier …'}
        rows={4}
        className="border-input bg-background w-full rounded-md border p-3 text-lg disabled:opacity-70"
      />
    </div>
  );
}
