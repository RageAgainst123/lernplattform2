'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { BlockView } from '@/components/blocks/BlockView';
import { Button } from '@/components/ui/button';

// Live-Vorschau für den Modul-Editor. Rendert einen Block aus dem aktuellen
// Stand, mit „Nächster/Vorheriger"-Navigation. Reuse BlockView (gleiche
// Komponente wie für Schüler:innen).

export function LivePreview({ blocks }: { blocks: Block[] }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<BlockAnswer | undefined>(undefined);
  const safeIndex = Math.min(index, Math.max(0, blocks.length - 1));
  const block = blocks[safeIndex];

  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Vorschau erscheint, sobald Blöcke vorhanden sind.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          Block {safeIndex + 1} / {blocks.length}
        </span>
        <span className="font-mono">{block.type}</span>
      </div>
      <div className="rounded-lg border p-4">
        <BlockView block={block} answer={answer} checked={false} onAnswer={(a) => setAnswer(a)} />
      </div>
      <div className="flex justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setAnswer(undefined);
          }}
          disabled={safeIndex === 0}
        >
          ← Zurück
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIndex((i) => Math.min(blocks.length - 1, i + 1));
            setAnswer(undefined);
          }}
          disabled={safeIndex === blocks.length - 1}
        >
          Weiter →
        </Button>
      </div>
    </div>
  );
}
