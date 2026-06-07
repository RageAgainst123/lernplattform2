'use client';

import type { OrderBlock as OrderBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Sub-Komponenten des OrderBlock (ausgelagert, damit die Hauptdatei unter der
// Zeilen-Grenze bleibt): Pool-Chips, Zeilen-Steuerung, Zeile.

type Item = OrderBlockType['items'][number];

// ▲▼×-Knöpfe einer Zeile.
function RowControls({
  index,
  total,
  itemText,
  itemId,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  itemText: string;
  itemId: string;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const btn = 'text-muted-foreground hover:text-foreground disabled:opacity-30';
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label="nach oben"
        className={btn}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1}
        aria-label="nach unten"
        className={btn}
      >
        ▼
      </button>
      <button
        type="button"
        onClick={() => onRemove(itemId)}
        aria-label={`${itemText} zurücklegen`}
        className={cn(btn, 'ml-1')}
      >
        ×
      </button>
    </span>
  );
}

// Eine Zeile in der Reihenfolge: Position + Text + Steuerung.
export function SequenceRow({
  item,
  index,
  total,
  checked,
  correctNeighbor,
  locked,
  onMove,
  onRemove,
}: {
  item: Item;
  index: number;
  total: number;
  checked: boolean;
  correctNeighbor: boolean;
  locked: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2',
        checked && index < total - 1 && (correctNeighbor ? 'border-green-500' : 'border-red-400')
      )}
    >
      <span className="text-muted-foreground w-5 text-sm tabular-nums">{index + 1}.</span>
      <span className="flex-1">{item.text}</span>
      {!locked && (
        <RowControls
          index={index}
          total={total}
          itemText={item.text}
          itemId={item.id}
          onMove={onMove}
          onRemove={onRemove}
        />
      )}
    </li>
  );
}

// Pool noch nicht platzierter Items zum Antippen.
export function OrderPool({
  ids,
  byId,
  onAdd,
}: {
  ids: string[];
  byId: Map<string, Item>;
  onAdd: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onAdd(id)}
          className="border-input bg-background hover:bg-muted rounded-md border px-3 py-2"
        >
          {byId.get(id)?.text} <span className="text-muted-foreground text-sm">↓</span>
        </button>
      ))}
    </div>
  );
}
