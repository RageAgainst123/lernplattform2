'use client';

import type { CategorizeBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import {
  AddButton,
  FieldLabel,
  ItemAction,
  TextArea,
  TextInput,
  makeOptionId,
} from './form-helpers';

// Form-Editor für categorize (Kategorien zuordnen / Bucket-Sort). Oben die
// Behälter (2–4), darunter die Items mit Behälter-Auswahl (= Lösung).
//
// Wenn ein Behälter gelöscht wird, dessen Items hingen → deren bucketId wird
// auf den ersten verbliebenen Behälter umgehängt (sonst wäre die Lösung
// ungültig). Schema erzwingt min 2 Behälter + min 2 Items.

type Props = {
  value: CategorizeBlock;
  onChange: (next: CategorizeBlock) => void;
};

export function CategorizeForm({ value, onChange }: Props) {
  const set = <K extends keyof CategorizeBlock>(key: K, v: CategorizeBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updateBucket(i: number, label: string) {
    set(
      'buckets',
      value.buckets.map((b, idx) => (idx === i ? { ...b, label } : b))
    );
  }
  function addBucket() {
    if (value.buckets.length >= 4) return;
    set('buckets', [...value.buckets, { id: makeOptionId(value.buckets, 'b'), label: '' }]);
  }
  function removeBucket(i: number) {
    if (value.buckets.length <= 2) return;
    const removed = value.buckets[i]!;
    const remaining = value.buckets.filter((_, idx) => idx !== i);
    const fallback = remaining[0]!.id;
    onChange({
      ...value,
      buckets: remaining,
      // Items, die auf den gelöschten Behälter zeigten, auf den ersten umhängen.
      items: value.items.map((it) =>
        it.bucketId === removed.id ? { ...it, bucketId: fallback } : it
      ),
    });
  }

  function updateItem(i: number, patch: Partial<CategorizeBlock['items'][number]>) {
    set(
      'items',
      value.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    );
  }
  function addItem() {
    set('items', [
      ...value.items,
      { id: makeOptionId(value.items, 'i'), text: '', bucketId: value.buckets[0]!.id },
    ]);
  }
  function removeItem(i: number) {
    if (value.items.length <= 2) return;
    set(
      'items',
      value.items.filter((_, idx) => idx !== i)
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
          placeholder={'optional, z.B. „Sortiere die Geräte in die richtigen Behälter."'}
          rows={2}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Behälter (2–4)</span>
        </div>
        <ul className="space-y-2">
          {value.buckets.map((bucket, i) => (
            <li key={bucket.id} className="flex items-center gap-2 rounded-md border p-2">
              <TextInput
                id={`${value.id}-bucket-${bucket.id}`}
                value={bucket.label}
                onChange={(v) => updateBucket(i, v)}
                placeholder={`Behälter ${i + 1}`}
              />
              <ItemAction
                onClick={() => removeBucket(i)}
                label="✕"
                disabled={value.buckets.length <= 2}
                tone="destructive"
              />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addBucket}>Behälter hinzufügen</AddButton>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Begriffe und ihr richtiger Behälter</span>
        </div>
        <ul className="space-y-2">
          {value.items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 rounded-md border p-2">
              <TextInput
                id={`${value.id}-item-${item.id}`}
                value={item.text}
                onChange={(v) => updateItem(i, { text: v })}
                placeholder={`Begriff ${i + 1}`}
              />
              <span className="text-muted-foreground shrink-0 text-xs">→</span>
              <select
                value={item.bucketId}
                onChange={(e) => updateItem(i, { bucketId: e.target.value })}
                className="border-input bg-background h-9 shrink-0 rounded-md border px-2 text-sm"
                aria-label={`Richtiger Behälter für Begriff ${i + 1}`}
              >
                {value.buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label || '(ohne Name)'}
                  </option>
                ))}
              </select>
              <ItemAction
                onClick={() => removeItem(i)}
                label="✕"
                disabled={value.items.length <= 2}
                tone="destructive"
              />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addItem}>Begriff hinzufügen</AddButton>
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
