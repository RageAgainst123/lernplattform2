'use client';

import { useState } from 'react';
import type { CategorizeBlock as CategorizeBlockType } from '@/lib/schemas/blocks';
import { AssignedChip, PoolChip } from '@/components/blocks/categorize-chips';

// Kategorisieren (Bucket-Sort): Items in benannte Behälter einsortieren.
// „Chip + Behälter-Auswahl"-Modell (Sek-I-tauglich, ruhige Optik):
//   1. Noch nicht einsortierte Begriffe stehen als Chips in einer Reihe.
//   2. Chip antippen → wird hervorgehoben, darunter werden die Behälter zu
//      aktiven, farbig umrandeten Ablege-Zielen + Hinweis „[Begriff] → wohin?".
//   3. Behälter antippen → Chip wandert hinein, Auswahl schließt sich.
//   4. Einsortierter Chip hat ein „×" zum Zurücklegen (kein versehentliches
//      Löschen durch bloßes Antippen).
//
// answer: Record<itemId, bucketId>. checked = grün/rot-Bewertung (Quiz),
// readOnly = gesperrt (Worksheet nach Abgabe).

type Block = CategorizeBlockType;
type Item = Block['items'][number];
type Bucket = Block['buckets'][number];

// Innenleben eines Behälters: Label + einsortierte Chips.
function BucketInner({
  bucket,
  items,
  checked,
  locked,
  armed,
  onUnassign,
}: {
  bucket: Bucket;
  items: Item[];
  checked: boolean;
  locked: boolean;
  armed: boolean;
  onUnassign: (itemId: string) => void;
}) {
  return (
    <>
      <span className="text-muted-foreground text-sm font-medium">{bucket.label}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <AssignedChip
            key={it.id}
            item={it}
            bucketId={bucket.id}
            checked={checked}
            locked={locked}
            onUnassign={onUnassign}
          />
        ))}
        {items.length === 0 && (
          <span className="text-muted-foreground/60 text-sm italic">
            {armed ? 'hier ablegen' : 'noch leer'}
          </span>
        )}
      </div>
    </>
  );
}

// Ein Behälter — als Ablege-Ziel (wenn ein Chip aktiv ist) oder als ruhige
// Sammel-Karte (sonst). Klick legt den aktiven Chip hinein.
function BucketDrop(props: {
  bucket: Bucket;
  items: Item[];
  checked: boolean;
  locked: boolean;
  armed: boolean; // ein Chip ist aktiv → Behälter ist Ablege-Ziel
  onDrop: () => void;
  onUnassign: (itemId: string) => void;
}) {
  const { armed, onDrop, ...inner } = props;
  if (armed) {
    return (
      <button
        type="button"
        onClick={onDrop}
        className="border-primary bg-primary/5 hover:bg-primary/10 min-h-24 rounded-lg border-2 p-3 text-left transition-colors"
      >
        <BucketInner {...inner} armed={armed} />
      </button>
    );
  }
  return (
    <div className="min-h-24 rounded-lg border border-dashed p-3">
      <BucketInner {...inner} armed={armed} />
    </div>
  );
}

// Der Pool noch-nicht-einsortierter Chips + der „wohin?"-Hinweis.
function Pool({
  unassigned,
  active,
  activeItem,
  onToggle,
}: {
  unassigned: Item[];
  active: string | null;
  activeItem: Item | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {unassigned.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unassigned.map((it) => (
            <PoolChip key={it.id} item={it} active={active === it.id} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Alle Begriffe einsortiert. ✓</p>
      )}
      {activeItem && (
        <p className="text-primary text-sm font-medium">
          {'„'}
          {activeItem.text}
          {'“'} → in welchen Behälter?
        </p>
      )}
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
  const [active, setActive] = useState<string | null>(null);
  const locked = checked || readOnly;
  const unassigned = block.items.filter((it) => !answer[it.id]);
  const activeItem = unassigned.find((it) => it.id === active) ?? null;

  function dropInto(bucketId: string) {
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
      {!locked && (
        <Pool
          unassigned={unassigned}
          active={active}
          activeItem={activeItem}
          onToggle={(id) => setActive(active === id ? null : id)}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {block.buckets.map((bucket) => (
          <BucketDrop
            key={bucket.id}
            bucket={bucket}
            items={block.items.filter((it) => answer[it.id] === bucket.id)}
            checked={checked}
            locked={locked}
            armed={!locked && activeItem !== null}
            onDrop={() => dropInto(bucket.id)}
            onUnassign={unassign}
          />
        ))}
      </div>
    </div>
  );
}
