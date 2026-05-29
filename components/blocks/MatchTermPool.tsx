'use client';

import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Pair = MatchBlockType['pairs'][number];

type Props = {
  pairs: Pair[];
  active: string | null;
  checked: boolean;
  readOnly?: boolean;
  onToggle: (pairId: string) => void;
};

// Die noch nicht zugeordneten Begriffe zum Antippen.
export function MatchTermPool({ pairs, active, checked, readOnly = false, onToggle }: Props) {
  const locked = checked || readOnly;
  return (
    <div className="flex flex-wrap gap-2">
      {pairs.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={locked}
          onClick={() => onToggle(p.id)}
          className={cn(
            'rounded-md border px-3 py-2 text-lg',
            active === p.id && 'border-primary bg-primary/10'
          )}
        >
          {p.term}
        </button>
      ))}
    </div>
  );
}
