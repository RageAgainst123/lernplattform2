'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { Block } from '@/lib/schemas/blocks';
import { endPresentation } from '@/lib/db/live-session-actions';
import { useIdleEnd } from '@/components/blocks/useIdleEnd';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';
import { LivePollBeamer } from '@/components/blocks/LivePollBeamer';
import { usePresentationLive } from '@/components/blocks/usePresentationLive';
import { EndPresentationButton } from '@/components/blocks/EndPresentationButton';

// Auto-Ende: läuft der Beamer ungenutzt (kein Folienwechsel) 30 min, wird die
// Session beendet — Schutz vor vergessenen Präsentationen.
const IDLE_END_MS = 30 * 60 * 1000;

// Tastatur-Navigation: ←/→ und Leertaste blättern. Ausgelagert, damit der Runner
// unter der max-lines-per-function-Grenze bleibt.
function useArrowNav(go: (delta: number, max: number) => void, total: number) {
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
}

// Navigationsleiste am unteren Rand: Zurück, Folienzähler, Weiter + (live) Beenden.
function NavBar({
  index,
  total,
  onPrev,
  onNext,
  classId,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  classId?: string;
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
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm tabular-nums">
          Folie {index + 1} / {total}
        </span>
        {classId && <EndPresentationButton classId={classId} />}
      </div>
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
//
// Mit classId/moduleId läuft sie als LIVE-Präsentation: startet eine Session,
// meldet jeden Folienwechsel (Schüler:innen-Geräte dimmen / zeigen Poll), und
// beendet beim Verlassen. Ohne diese Props ist es eine reine lokale Vorschau.
export function PresentationRunner({
  blocks,
  classId,
  moduleId,
}: {
  blocks: Block[];
  classId?: string;
  moduleId?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = blocks.length;
  const router = useRouter();

  usePresentationLive(classId, moduleId, index);

  // Auto-Ende bei Inaktivität (nur Live-Modus). bump() setzt den Timer bei jeder
  // Navigation zurück; läuft er ab, wird die Session beendet + zurücknavigiert.
  const bumpIdle = useIdleEnd(() => {
    if (classId) {
      void endPresentation(classId);
      router.push(`/lehrer/klassen/${classId}`);
    }
  }, IDLE_END_MS);

  const go = useCallback(
    (delta: number, max: number) => {
      bumpIdle();
      setIndex((i) => Math.min(Math.max(i + delta, 0), max - 1));
    },
    [bumpIdle]
  );

  useArrowNav(go, total);

  if (total === 0) {
    return (
      <p className="text-muted-foreground p-8 text-center">Diese Präsentation hat keine Folien.</p>
    );
  }

  return <Stage block={blocks[index]} index={index} total={total} go={go} classId={classId} />;
}

// Bühne: große Folien-Darstellung + Navigationsleiste. Ausgelagert, damit die
// Runner-Funktion mit dem Live-Hook unter der Zeilen-Grenze bleibt.
function Stage({
  block,
  index,
  total,
  go,
  classId,
}: {
  block: Block;
  index: number;
  total: number;
  go: (delta: number, max: number) => void;
  classId?: string;
}) {
  // Live-Poll-Folie + laufende Session → Beamer zeigt wachsende Ergebnisbalken.
  // Sonst normale Block-Darstellung über BlockView.
  const body =
    block.type === 'live_poll' && classId ? (
      <LivePollBeamer block={block} classId={classId} />
    ) : (
      <BlockView block={block} answer={undefined} checked={false} onAnswer={() => {}} />
    );
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-8 sm:p-16">{body}</div>
      <NavBar
        index={index}
        total={total}
        onPrev={() => go(-1, total)}
        onNext={() => go(1, total)}
        classId={classId}
      />
    </div>
  );
}
