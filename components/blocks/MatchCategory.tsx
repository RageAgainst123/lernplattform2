'use client';

import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Pair = MatchBlockType['pairs'][number];

type Props = {
  category: string;
  pairs: Pair[]; // dieser Kategorie zugeordnete Paare
  checked: boolean;
  readOnly?: boolean;
  disabled: boolean;
  onAssign: () => void;
  onUnassign: (pairId: string) => void;
};

export function MatchCategory({
  category,
  pairs,
  checked,
  readOnly = false,
  disabled,
  onAssign,
  onUnassign,
}: Props) {
  const locked = checked || readOnly;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAssign}
      className="min-h-24 rounded-lg border border-dashed p-3 text-left"
    >
      <span className="text-muted-foreground text-sm">{category}</span>
      <ul className="mt-2 space-y-1">
        {pairs.map((p) => (
          <li
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!locked) onUnassign(p.id);
            }}
            className={cn(
              'rounded border px-2 py-1',
              checked &&
                (p.category === category
                  ? 'border-green-600 text-green-700'
                  : 'border-red-600 text-red-700'),
              readOnly && !checked && 'opacity-80'
            )}
          >
            {p.term}
          </li>
        ))}
      </ul>
    </button>
  );
}
