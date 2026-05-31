'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';

// Navigationsleiste am unteren Rand: Zurück, Folienzähler, Weiter.
function NavBar({
  index,
  total,
  onPrev,
  onNext,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t p-4">
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={index === 0}
        className="h-12 px-6"
        aria-label="Vorherige Folie"
      >
        <ChevronLeftIcon className="size-5" aria-hidden />
        Zurück
      </Button>
      <span className="text-muted-foreground text-sm tabular-nums">
        Folie {index + 1} / {total}
      </span>
      <Button
        onClick={onNext}
        disabled={index === total - 1}
        className="h-12 px-6"
        aria-label="Nächste Folie"
      >
        Weiter
        <ChevronRightIcon className="size-5" aria-hidden />
      </Button>
    </div>
  );
}

// Beamer-Präsentation: zeigt EINEN Block gross, durchblätterbar mit Buttons
// und Tastatur (←/→, Leertaste vor). Kein Scoring, kein Speichern — reine
// Anzeige für den geführten Stundeneinstieg (display_mode 'presentation').
export function PresentationRunner({ blocks }: { blocks: Block[] }) {
  const [index, setIndex] = useState(0);
  const total = blocks.length;

  const go = useCallback((delta: number, max: number) => {
    setIndex((i) => Math.min(Math.max(i + delta, 0), max - 1));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1, total);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1, total);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, total]);

  if (total === 0) {
    return (
      <p className="text-muted-foreground p-8 text-center">Diese Präsentation hat keine Folien.</p>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-8 sm:p-16">
        <BlockView block={blocks[index]} answer={undefined} checked={false} onAnswer={() => {}} />
      </div>
      <NavBar
        index={index}
        total={total}
        onPrev={() => go(-1, total)}
        onNext={() => go(1, total)}
      />
    </div>
  );
}
