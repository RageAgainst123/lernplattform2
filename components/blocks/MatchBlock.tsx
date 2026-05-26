'use client';

import { useMemo, useState } from 'react';
import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';
import { MatchCategory } from '@/components/blocks/MatchCategory';
import { MatchTermPool } from '@/components/blocks/MatchTermPool';

type Props = {
  block: MatchBlockType;
  assignment: Record<string, string>; // pairId → Kategorie
  checked: boolean;
  onAssign: (next: Record<string, string>) => void;
};

export function MatchBlock({ block, assignment, checked, onAssign }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(block.pairs.map((p) => p.category))], [block.pairs]);
  const unassigned = block.pairs.filter((p) => !assignment[p.id]);

  function assignTo(category: string) {
    if (!active) return;
    onAssign({ ...assignment, [active]: category });
    setActive(null);
  }

  function unassign(pairId: string) {
    const next = { ...assignment };
    delete next[pairId];
    onAssign(next);
  }

  return (
    <div className="space-y-4">
      {block.question && <p className="text-lg font-medium">{block.question}</p>}
      <MatchTermPool
        pairs={unassigned}
        active={active}
        checked={checked}
        onToggle={(id) => setActive(active === id ? null : id)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <MatchCategory
            key={cat}
            category={cat}
            pairs={block.pairs.filter((p) => assignment[p.id] === cat)}
            checked={checked}
            disabled={checked || !active}
            onAssign={() => assignTo(cat)}
            onUnassign={unassign}
          />
        ))}
      </div>
    </div>
  );
}
