'use client';

import type { MatchBlock } from '@/lib/schemas/blocks';
import {
  AddButton,
  FieldLabel,
  ItemAction,
  TextArea,
  TextInput,
  makeOptionId,
} from './form-helpers';

// Form-Editor für match (Zuordnen). Schüler:in soll Begriffe ihren Kategorien
// zuordnen. Liste mit term + category pro Paar.

type Props = {
  value: MatchBlock;
  onChange: (next: MatchBlock) => void;
};

export function MatchForm({ value, onChange }: Props) {
  const set = <K extends keyof MatchBlock>(key: K, v: MatchBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updatePair(i: number, patch: Partial<MatchBlock['pairs'][number]>) {
    set(
      'pairs',
      value.pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );
  }
  function addPair() {
    set('pairs', [...value.pairs, { id: makeOptionId(value.pairs, 'p'), term: '', category: '' }]);
  }
  function removePair(i: number) {
    if (value.pairs.length <= 2) return;
    set(
      'pairs',
      value.pairs.filter((_, idx) => idx !== i)
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-q`}>Aufgabenstellung</FieldLabel>
        <TextArea
          id={`${value.id}-q`}
          value={value.question ?? ''}
          onChange={(v) => set('question', v || undefined)}
          placeholder={'optional, z.B. „Ordne die Begriffe den richtigen Kategorien zu."'}
          rows={2}
        />
      </div>
      <div>
        <span className="mb-2 block text-xs font-medium">Begriffe und ihre Kategorien</span>
        <ul className="space-y-2">
          {value.pairs.map((pair, i) => (
            <li key={pair.id} className="flex items-center gap-2 rounded-md border p-2">
              <TextInput
                id={`${value.id}-term-${pair.id}`}
                value={pair.term}
                onChange={(v) => updatePair(i, { term: v })}
                placeholder={`Begriff ${i + 1}`}
              />
              <span className="text-muted-foreground shrink-0 text-xs">→</span>
              <TextInput
                id={`${value.id}-cat-${pair.id}`}
                value={pair.category}
                onChange={(v) => updatePair(i, { category: v })}
                placeholder={`Kategorie ${i + 1}`}
              />
              <ItemAction
                onClick={() => removePair(i)}
                label="✕"
                disabled={value.pairs.length <= 2}
                tone="destructive"
              />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addPair}>Paar hinzufügen</AddButton>
        </div>
      </div>
    </div>
  );
}
