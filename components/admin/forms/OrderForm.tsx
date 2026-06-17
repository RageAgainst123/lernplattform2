'use client';

import type { OrderBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { AddButton, FieldLabel, ItemAction, TextInput, makeOptionId } from './form-helpers';

// Form-Editor für order (Reihenfolge). Die Items werden in der KORREKTEN
// Reihenfolge eingegeben (das ist die Lösung) — im Schüler:innen-Renderer
// erscheinen sie gemischt. Per ▲▼ ordnet der/die Autor:in um.

type Props = {
  value: OrderBlock;
  onChange: (next: OrderBlock) => void;
};

export function OrderForm({ value, onChange }: Props) {
  function updateItem(i: number, text: string) {
    onChange({
      ...value,
      items: value.items.map((it, idx) => (idx === i ? { ...it, text } : it)),
    });
  }
  function addItem() {
    onChange({
      ...value,
      items: [...value.items, { id: makeOptionId(value.items, 'i'), text: '' }],
    });
  }
  function removeItem(i: number) {
    if (value.items.length <= 2) return;
    onChange({ ...value, items: value.items.filter((_, idx) => idx !== i) });
  }
  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= value.items.length) return;
    const items = [...value.items];
    [items[i], items[target]] = [items[target]!, items[i]!];
    onChange({ ...value, items });
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-instruction`}>Aufgabenstellung</FieldLabel>
        <TextInput
          id={`${value.id}-instruction`}
          value={value.instruction}
          onChange={(v) => onChange({ ...value, instruction: v })}
          placeholder={'z.B. „Bring die Schritte in die richtige Reihenfolge."'}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium">
          Items in der <strong>richtigen</strong> Reihenfolge (= Lösung). Schüler:innen sehen sie
          gemischt.
        </p>
        <ul className="space-y-2">
          {value.items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 rounded-md border p-2">
              <span className="text-muted-foreground w-5 text-xs tabular-nums">{i + 1}.</span>
              <TextInput
                id={`${value.id}-item-${item.id}`}
                value={item.text}
                onChange={(v) => updateItem(i, v)}
                placeholder={`Item ${i + 1}`}
              />
              <ItemAction onClick={() => move(i, -1)} label="▲" disabled={i === 0} />
              <ItemAction
                onClick={() => move(i, 1)}
                label="▼"
                disabled={i === value.items.length - 1}
              />
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
          <AddButton onClick={addItem}>Item hinzufügen</AddButton>
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
