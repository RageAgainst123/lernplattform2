'use client';

import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Pair = MatchBlockType['pairs'][number];

// Ein zugeordnetes Paar im Kategorie-Behälter; sichtbares „×" legt es zurück.
function AssignedPair({
  pair,
  category,
  checked,
  locked,
  onUnassign,
}: {
  pair: Pair;
  category: string;
  checked: boolean;
  locked: boolean;
  onUnassign: (pairId: string) => void;
}) {
  const correct = pair.category === category;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5',
        checked && (correct ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'),
        !checked && locked && 'opacity-80'
      )}
    >
      {pair.term}
      {!locked && (
        <button
          type="button"
          onClick={() => onUnassign(pair.id)}
          aria-label={`${pair.term} zurücklegen`}
          className="text-muted-foreground hover:text-foreground -mr-1 leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

// Label + die zugeordneten Paar-Chips eines Behälters.
function CategoryInner({
  category,
  pairs,
  checked,
  locked,
  armed,
  onUnassign,
}: {
  category: string;
  pairs: Pair[];
  checked: boolean;
  locked: boolean;
  armed: boolean;
  onUnassign: (pairId: string) => void;
}) {
  return (
    <>
      <span className="text-muted-foreground text-sm">{category}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {pairs.map((p) => (
          <AssignedPair
            key={p.id}
            pair={p}
            category={category}
            checked={checked}
            locked={locked}
            onUnassign={onUnassign}
          />
        ))}
        {pairs.length === 0 && (
          <span className="text-muted-foreground/60 text-sm italic">
            {armed ? 'hier ablegen' : 'noch leer'}
          </span>
        )}
      </div>
    </>
  );
}

type Props = {
  category: string;
  pairs: Pair[]; // dieser Kategorie zugeordnete Paare
  checked: boolean;
  readOnly?: boolean;
  disabled: boolean; // kein aktiver Begriff → kein Ablege-Ziel
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
  const armed = !disabled; // ein Begriff ist aktiv → Behälter ist Ablege-Ziel
  const inner = (
    <CategoryInner
      category={category}
      pairs={pairs}
      checked={checked}
      locked={locked}
      armed={armed}
      onUnassign={onUnassign}
    />
  );

  // role="button"-div statt <button>, damit die „×"-Knöpfe der zugeordneten
  // Paare legal darin verschachtelt werden können (kein button-in-button).
  if (armed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onAssign}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAssign();
          }
        }}
        className="border-primary bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring min-h-24 cursor-pointer rounded-lg border-2 p-3 text-left transition-colors focus:outline-none focus-visible:ring-2"
      >
        {inner}
      </div>
    );
  }
  return <div className="min-h-24 rounded-lg border border-dashed p-3">{inner}</div>;
}
