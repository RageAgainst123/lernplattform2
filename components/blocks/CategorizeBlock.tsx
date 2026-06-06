'use client';

import { useState } from 'react';
import type { CategorizeBlock as CategorizeBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Kategorisieren (Bucket-Sort): Items in benannte Behälter einsortieren.
// Tap-basiert (kein Drag): Item antippen → aktiv markiert → Behälter antippen
// → Item wandert hinein. Item im Behälter antippen → zurück in den Pool.
// Folgt dem MatchBlock-Interaktionsmuster, ist aber bewusst eigenständig
// (eigene Bausteine), damit Änderungen hier den Match-Block nicht berühren.
//
// answer: Record<itemId, bucketId>. checked = grün/rot-Bewertung (Quiz),
// readOnly = gesperrt (Worksheet nach Abgabe).

type Item = CategorizeBlockType['items'][number];

// Ein einsortiertes Item im Behälter. checked färbt richtig/falsch.
function BucketItem({
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
  return (
    <li
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) onUnassign(item.id);
      }}
      className={cn(
        'rounded border px-2 py-1',
        checked &&
          (item.bucketId === bucketId
            ? 'border-green-600 text-green-700'
            : 'border-red-600 text-red-700')
      )}
    >
      {item.text}
    </li>
  );
}

// Ein Behälter mit den einsortierten Items.
function Bucket({
  label,
  items,
  bucketId,
  checked,
  readOnly,
  disabled,
  onAssign,
  onUnassign,
}: {
  label: string;
  items: Item[];
  bucketId: string;
  checked: boolean;
  readOnly: boolean;
  disabled: boolean;
  onAssign: () => void;
  onUnassign: (itemId: string) => void;
}) {
  const locked = checked || readOnly;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAssign}
      className="min-h-24 rounded-lg border border-dashed p-3 text-left"
    >
      <span className="text-muted-foreground text-sm">{label}</span>
      <ul className="mt-2 space-y-1">
        {items.map((it) => (
          <BucketItem
            key={it.id}
            item={it}
            bucketId={bucketId}
            checked={checked}
            locked={locked}
            onUnassign={onUnassign}
          />
        ))}
      </ul>
    </button>
  );
}

// Pool der noch nicht einsortierten Items zum Antippen.
function Pool({
  items,
  active,
  locked,
  onToggle,
}: {
  items: Item[];
  active: string | null;
  locked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={locked}
          onClick={() => onToggle(it.id)}
          className={cn(
            'rounded-md border px-3 py-2 text-lg',
            active === it.id && 'border-primary bg-primary/10'
          )}
        >
          {it.text}
        </button>
      ))}
      {items.length === 0 && (
        <span className="text-muted-foreground text-sm">Alle Begriffe einsortiert.</span>
      )}
    </div>
  );
}

type Props = {
  block: CategorizeBlockType;
  answer: Record<string, string>; // itemId → gewählter bucketId
  checked: boolean;
  readOnly?: boolean;
  onAssign: (next: Record<string, string>) => void;
};

export function CategorizeBlock({ block, answer, checked, readOnly = false, onAssign }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const locked = checked || readOnly;
  const unassigned = block.items.filter((it) => !answer[it.id]);

  function assignTo(bucketId: string) {
    if (!active) return;
    onAssign({ ...answer, [active]: bucketId });
    setActive(null);
  }
  function unassign(itemId: string) {
    const next = { ...answer };
    delete next[itemId];
    onAssign(next);
  }

  return (
    <div className="space-y-4">
      {block.question && <p className="text-lg font-medium">{block.question}</p>}
      <Pool
        items={unassigned}
        active={active}
        locked={locked}
        onToggle={(id) => setActive(active === id ? null : id)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {block.buckets.map((bucket) => (
          <Bucket
            key={bucket.id}
            label={bucket.label}
            bucketId={bucket.id}
            items={block.items.filter((it) => answer[it.id] === bucket.id)}
            checked={checked}
            readOnly={readOnly}
            disabled={locked || !active}
            onAssign={() => assignTo(bucket.id)}
            onUnassign={unassign}
          />
        ))}
      </div>
    </div>
  );
}
