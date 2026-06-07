'use client';

import { useMemo } from 'react';
import type { OrderBlock as OrderBlockType } from '@/lib/schemas/blocks';
import { useShuffled } from '@/components/blocks/useShuffled';
import { OrderPool, SequenceRow } from '@/components/blocks/order-parts';

// Reihenfolge: Items in die richtige Reihenfolge bringen. Sek-I-tauglich ohne
// Drag-Library: noch nicht platzierte Items stehen als Chips im Pool (gemischt),
// per Tipp wandern sie ans Ende der Reihenfolge. In der Reihenfolge ordnet man
// per ▲▼-Knöpfen um; ein Item kann per × zurück in den Pool.
// Sub-Komponenten (Pool, Zeile, Steuerung) leben in order-parts.tsx.
//
// answer: string[] der itemIds in gewählter Reihenfolge. checked = grün/rot-
// Bewertung (richtige Nachbarpaare grün), readOnly = gesperrt.

type Item = OrderBlockType['items'][number];

// Die nummerierte Reihenfolge-Liste mit Bewertungs-Färbung.
function SequenceList({
  answer,
  byId,
  checked,
  locked,
  correctIndex,
  onMove,
  onRemove,
}: {
  answer: string[];
  byId: Map<string, Item>;
  checked: boolean;
  locked: boolean;
  correctIndex: Map<string, number>;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const isCorrectNeighbor = (id: string, nextId: string | undefined) =>
    nextId !== undefined &&
    correctIndex.get(id) !== undefined &&
    correctIndex.get(nextId) === (correctIndex.get(id) ?? -2) + 1;
  return (
    <ol className="space-y-1">
      {answer.map((id, i) => {
        const it = byId.get(id);
        if (!it) return null;
        return (
          <SequenceRow
            key={id}
            item={it}
            index={i}
            total={answer.length}
            checked={checked}
            correctNeighbor={isCorrectNeighbor(id, answer[i + 1])}
            locked={locked}
            onMove={onMove}
            onRemove={onRemove}
          />
        );
      })}
      {answer.length === 0 && (
        <li className="text-muted-foreground/60 text-sm italic">
          Tippe oben die Begriffe in der richtigen Reihenfolge an.
        </li>
      )}
    </ol>
  );
}

type Props = {
  block: OrderBlockType;
  answer: string[];
  checked: boolean;
  readOnly?: boolean;
  onReorder: (next: string[]) => void;
};

export function OrderBlock({ block, answer, checked, readOnly = false, onReorder }: Props) {
  const locked = checked || readOnly;
  const byId = useMemo(() => new Map(block.items.map((it) => [it.id, it])), [block.items]);
  const poolIds = useMemo(
    () => block.items.map((it) => it.id).filter((id) => !answer.includes(id)),
    [block.items, answer]
  );
  const shuffledPool = useShuffled(poolIds);
  const correctIndex = useMemo(() => {
    const m = new Map<string, number>();
    block.items.forEach((it, i) => m.set(it.id, i));
    return m;
  }, [block.items]);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= answer.length) return;
    const next = [...answer];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onReorder(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      {!locked && shuffledPool.length > 0 && (
        <OrderPool ids={shuffledPool} byId={byId} onAdd={(id) => onReorder([...answer, id])} />
      )}
      <SequenceList
        answer={answer}
        byId={byId}
        checked={checked}
        locked={locked}
        correctIndex={correctIndex}
        onMove={move}
        onRemove={(rid) => onReorder(answer.filter((x) => x !== rid))}
      />
    </div>
  );
}
