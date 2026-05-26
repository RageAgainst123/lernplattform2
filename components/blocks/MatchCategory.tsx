'use client';

import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Pair = MatchBlockType['pairs'][number];

type Props = {
  category: string;
  pairs: Pair[]; // dieser Kategorie zugeordnete Paare
  checked: boolean;
  disabled: boolean;
  onAssign: () => void;
  onUnassign: (pairId: string) => void;
};

export function MatchCategory({ category, pairs, checked, disabled, onAssign, onUnassign }: Props) {
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
              if (!checked) onUnassign(p.id);
            }}
            className={cn(
              'rounded border px-2 py-1',
              checked &&
                (p.category === category
                  ? 'border-green-600 text-green-700'
                  : 'border-red-600 text-red-700')
            )}
          >
            {p.term}
          </li>
        ))}
      </ul>
    </button>
  );
}
