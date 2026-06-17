'use client';

import type { MemoryBlock } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Karten-Sub-Komponente für den MemoryBlock (ausgelagert, damit die
// Haupt-Komponente unter der Zeilen-Grenze bleibt). Eine Karte zeigt entweder
// `text` oder ein Bild und kann zugedeckt, offen, gematcht oder (im
// gesperrten Zustand) richtig/falsch eingefärbt sein.

type CardContent = MemoryBlock['pairs'][number]['a'];

export type MemoryCardView = {
  key: string; // z.B. "p1:a"
  pairId: string;
  content: CardContent;
};

function CardFace({ content }: { content: CardContent }) {
  if (content.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={content.imageUrl} alt="" className="max-h-20 max-w-full object-contain" />;
  }
  return <span className="px-1 text-center text-sm font-medium break-words">{content.text}</span>;
}

// Farbklasse je Karten-Zustand (ausgelagert, hält MemoryCard unter Komplexität 10).
function faceClass(shown: boolean, matched: boolean, locked: boolean): string {
  if (!shown) return 'border-input bg-muted hover:bg-muted/70 cursor-pointer';
  if (matched) return 'border-green-600 bg-green-50 text-green-800';
  if (locked) return 'border-input bg-background text-muted-foreground';
  return 'border-primary bg-primary/5';
}

export function MemoryCard({
  card,
  faceUp,
  matched,
  locked,
  onFlip,
}: {
  card: MemoryCardView;
  faceUp: boolean;
  matched: boolean;
  locked: boolean;
  onFlip: (key: string) => void;
}) {
  const shown = faceUp || matched || locked;
  return (
    <button
      type="button"
      disabled={locked || matched || faceUp}
      onClick={() => onFlip(card.key)}
      aria-pressed={shown}
      className={cn(
        'flex aspect-square items-center justify-center rounded-lg border-2 p-2 transition-colors',
        faceClass(shown, matched, locked)
      )}
    >
      {shown ? <CardFace content={card.content} /> : <span className="text-2xl">🃏</span>}
    </button>
  );
}
