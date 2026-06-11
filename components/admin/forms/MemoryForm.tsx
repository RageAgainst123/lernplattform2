'use client';

import type { MemoryBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { MemoryCardField } from './memory-card-field';
import { AddButton, FieldLabel, ItemAction, TextInput, makeOptionId } from './form-helpers';

// Form-Editor für memory (Paare-Spiel). Pro Paar zwei Karten-Editoren
// (Text ODER Bild). Schema erzwingt 3–8 Paare + eindeutige pair-ids.

type Props = {
  value: MemoryBlock;
  onChange: (next: MemoryBlock) => void;
};

type Pair = MemoryBlock['pairs'][number];

export function MemoryForm({ value, onChange }: Props) {
  const set = <K extends keyof MemoryBlock>(key: K, v: MemoryBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updatePair(i: number, patch: Partial<Pair>) {
    set(
      'pairs',
      value.pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );
  }
  function addPair() {
    if (value.pairs.length >= 8) return;
    set('pairs', [
      ...value.pairs,
      { id: makeOptionId(value.pairs, 'p'), a: { text: '' }, b: { text: '' } },
    ]);
  }
  function removePair(i: number) {
    if (value.pairs.length <= 3) return;
    set(
      'pairs',
      value.pairs.filter((_, idx) => idx !== i)
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-instr`}>Aufgabenstellung</FieldLabel>
        <TextInput
          id={`${value.id}-instr`}
          value={value.instruction}
          onChange={(v) => set('instruction', v)}
          placeholder={'z.B. „Finde die passenden Paare."'}
        />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Paare (3–8)</div>
        <ul className="space-y-2">
          {value.pairs.map((pair, i) => (
            <li key={pair.id} className="flex items-start gap-2 rounded-md border p-2">
              <MemoryCardField
                idBase={`${value.id}-${pair.id}-a`}
                label="Karte 1"
                card={pair.a}
                onChange={(a) => updatePair(i, { a })}
              />
              <span className="text-muted-foreground mt-6 shrink-0 text-xs">↔</span>
              <MemoryCardField
                idBase={`${value.id}-${pair.id}-b`}
                label="Karte 2"
                card={pair.b}
                onChange={(b) => updatePair(i, { b })}
              />
              <ItemAction
                onClick={() => removePair(i)}
                label="✕"
                disabled={value.pairs.length <= 3}
                tone="destructive"
              />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addPair}>Paar hinzufügen</AddButton>
        </div>
      </div>

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
