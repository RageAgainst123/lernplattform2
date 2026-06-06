'use client';

import type { CategorizeBlock as CategorizeBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Chip-Sub-Komponenten für den CategorizeBlock (ausgelagert, damit die
// Haupt-Komponente unter der Zeilen-Grenze bleibt).

type Item = CategorizeBlockType['items'][number];

// Ein noch nicht einsortierter Begriff als anklickbarer Chip im Pool.
export function PoolChip({
  item,
  active,
  onToggle,
}: {
  item: Item;
  active: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-2 text-base font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-input bg-background hover:bg-muted'
      )}
    >
      {item.text}
    </button>
  );
}

// Einsortierter Begriff als Chip im Behälter; „×" legt ihn zurück.
export function AssignedChip({
  item,
  bucketId,
  checked,
  locked,
  onUnassign,
}: {
  item: Item;
  bucketId: string;
  checked: boolean;
  locked: boolean;
  onUnassign: (itemId: string) => void;
}) {
  const correct = item.bucketId === bucketId;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm',
        checked
          ? correct
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-red-600 bg-red-50 text-red-700'
          : 'border-input bg-background'
      )}
    >
      {item.text}
      {!locked && (
        <button
          type="button"
          onClick={() => onUnassign(item.id)}
          aria-label={`${item.text} zurücklegen`}
          className="text-muted-foreground hover:text-foreground -mr-1 leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
