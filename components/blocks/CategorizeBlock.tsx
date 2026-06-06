'use client';

import type { CategorizeBlock as CategorizeBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Kategorisieren (Bucket-Sort): Items in benannte Behälter einsortieren.
// Ein-Klick-Modell (Sek-I-tauglich): jeder Begriff im Pool zeigt direkt
// einen Knopf pro Behälter („→ Eingabe", „→ Ausgabe"). Ein Tipp sortiert
// sofort ein — kein versteckter „aktiv markiert"-Zwischenschritt. Einsortierte
// Items haben einen klaren „↩ zurück"-Knopf (kein versehentliches Löschen
// durch Antippen).
//
// answer: Record<itemId, bucketId>. checked = grün/rot-Bewertung (Quiz),
// readOnly = gesperrt (Worksheet nach Abgabe).

type Block = CategorizeBlockType;
type Item = Block['items'][number];
type Bucket = Block['buckets'][number];

// Ein noch nicht einsortierter Begriff mit je einem Knopf pro Behälter.
function PoolRow({
  item,
  buckets,
  onAssign,
}: {
  item: Item;
  buckets: Bucket[];
  onAssign: (itemId: string, bucketId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
      <span className="mr-1 text-lg font-medium">{item.text}</span>
      <span className="flex flex-wrap gap-2">
        {buckets.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onAssign(item.id, b.id)}
            className="border-primary/40 text-primary hover:bg-primary/10 rounded-md border px-3 py-1 text-sm font-medium"
          >
            → {b.label}
          </button>
        ))}
      </span>
    </div>
  );
}

// Ein einsortiertes Item im Behälter (read-only oder mit „zurück"-Knopf).
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
      className={cn(
        'flex items-center justify-between gap-2 rounded border px-2 py-1',
        checked &&
          (item.bucketId === bucketId
            ? 'border-green-600 text-green-700'
            : 'border-red-600 text-red-700')
      )}
    >
      <span>{item.text}</span>
      {!locked && (
        <button
          type="button"
          onClick={() => onUnassign(item.id)}
          aria-label={`${item.text} zurücklegen`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ↩
        </button>
      )}
    </li>
  );
}

// Ein Behälter mit den einsortierten Items.
function BucketColumn({
  bucket,
  items,
  checked,
  locked,
  onUnassign,
}: {
  bucket: Bucket;
  items: Item[];
  checked: boolean;
  locked: boolean;
  onUnassign: (itemId: string) => void;
}) {
  return (
    <div className="min-h-24 rounded-lg border border-dashed p-3">
      <span className="text-muted-foreground text-sm">{bucket.label}</span>
      <ul className="mt-2 space-y-1">
        {items.map((it) => (
          <BucketItem
            key={it.id}
            item={it}
            bucketId={bucket.id}
            checked={checked}
            locked={locked}
            onUnassign={onUnassign}
          />
        ))}
        {items.length === 0 && (
          <li className="text-muted-foreground/60 text-sm italic">noch leer</li>
        )}
      </ul>
    </div>
  );
}

type Props = {
  block: Block;
  answer: Record<string, string>; // itemId → gewählter bucketId
  checked: boolean;
  readOnly?: boolean;
  onAssign: (next: Record<string, string>) => void;
};

export function CategorizeBlock({ block, answer, checked, readOnly = false, onAssign }: Props) {
  const locked = checked || readOnly;
  const unassigned = block.items.filter((it) => !answer[it.id]);

  function assign(itemId: string, bucketId: string) {
    onAssign({ ...answer, [itemId]: bucketId });
  }
  function unassign(itemId: string) {
    const next = { ...answer };
    delete next[itemId];
    onAssign(next);
  }

  return (
    <div className="space-y-4">
      {block.question && <p className="text-lg font-medium">{block.question}</p>}
      {!locked && unassigned.length > 0 && (
        <div className="space-y-2">
          {unassigned.map((it) => (
            <PoolRow key={it.id} item={it} buckets={block.buckets} onAssign={assign} />
          ))}
        </div>
      )}
      {!locked && unassigned.length === 0 && (
        <p className="text-muted-foreground text-sm">Alle Begriffe einsortiert.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {block.buckets.map((bucket) => (
          <BucketColumn
            key={bucket.id}
            bucket={bucket}
            items={block.items.filter((it) => answer[it.id] === bucket.id)}
            checked={checked}
            locked={locked}
            onUnassign={unassign}
          />
        ))}
      </div>
    </div>
  );
}
