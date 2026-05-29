'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import { blockSchema } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';

// Block-Liste: jeder Block als JSON-editierbare Karte. Auf-/Abwärts, Löschen.
// Bewusst KEIN typ-spezifischer Form-Editor — das wäre 7× Formularcode.
// Wir nutzen JSON, weil Geo eh KI-Output paste und gezielt umarbeitet.

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function BlockCard({
  block,
  index,
  total,
  onMove,
  onDelete,
  onUpdate,
}: {
  block: Block;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpdate: (block: Block) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(block, null, 2));
  const [error, setError] = useState<string | null>(null);

  function tryUpdate(next: string) {
    setText(next);
    try {
      const parsed = blockSchema.parse(JSON.parse(next));
      setError(null);
      onUpdate(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Ungültiges JSON');
    }
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs">{block.type}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0}>
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
          >
            ↓
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Block löschen">
            ✕
          </Button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => tryUpdate(e.target.value)}
        rows={Math.min(12, Math.max(4, text.split('\n').length))}
        className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs"
        spellCheck={false}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export function BlockList({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Noch keine Blöcke. Importiere JSON oder füge unten welche hinzu.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id + ':' + i}
          block={b}
          index={i}
          total={blocks.length}
          onMove={(dir) => onChange(moveItem(blocks, i, i + dir))}
          onDelete={() => onChange(blocks.filter((_, j) => j !== i))}
          onUpdate={(next) => onChange(blocks.map((bb, j) => (j === i ? next : bb)))}
        />
      ))}
    </div>
  );
}
