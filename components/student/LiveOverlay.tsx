'use client';

import { useLiveSync } from '@/components/student/useLiveSync';
import { PollOverlay } from '@/components/student/overlays/PollOverlay';
import { WordCloudOverlay } from '@/components/student/overlays/WordCloudOverlay';
import { ScaleOverlay } from '@/components/student/overlays/ScaleOverlay';
import { UnderstandingOverlay } from '@/components/student/overlays/UnderstandingOverlay';
import type { LiveState } from '@/app/api/live/route';

// Vollflächiges Overlay über dem gesamten Schüler:innen-Bereich. Während einer
// Live-Präsentation der Lehrer:in:
//   - reine Folie       → dunkles „Schau nach vorne"-Overlay
//   - interaktive Folie → passendes Overlay je nach interaction.kind
//
// key={blockId} sorgt bei jeder neuen Folie für einen Remount → lokaler State
// (voted, text, …) resettet sich automatisch ohne Effect.

function DimOverlay() {
  return (
    <div
      className="bg-foreground/95 text-background fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-8 text-center"
      role="dialog"
      aria-live="polite"
    >
      <span className="text-6xl" aria-hidden>
        📺
      </span>
      <p className="text-2xl font-semibold">Schau nach vorne</p>
      <p className="text-background/70 text-sm">Die Lehrer:in präsentiert gerade.</p>
    </div>
  );
}

function InteractionOverlay({ state }: { state: Extract<LiveState, { interactive: true }> }) {
  const { interaction } = state;
  const { kind, blockId, locked } = interaction;
  if (kind === 'live_poll' || kind === 'quiz_poll') {
    return (
      <PollOverlay
        key={blockId}
        blockId={blockId}
        question={interaction.question}
        options={interaction.options}
        locked={locked}
      />
    );
  }
  if (kind === 'word_cloud') {
    return (
      <WordCloudOverlay
        key={blockId}
        blockId={blockId}
        question={interaction.question}
        locked={locked}
      />
    );
  }
  if (kind === 'scale') {
    return (
      <ScaleOverlay
        key={blockId}
        blockId={blockId}
        question={interaction.question}
        min={interaction.min}
        max={interaction.max}
        minLabel={interaction.minLabel}
        maxLabel={interaction.maxLabel}
        locked={locked}
      />
    );
  }
  // understanding
  return (
    <UnderstandingOverlay
      key={blockId}
      blockId={blockId}
      question={interaction.question}
      locked={locked}
    />
  );
}

// Phase T5: classId-prop optional (Server-Layout reicht aus jose-Session weiter).
// Bei classId=null laeuft useLiveSync polling-only.
export function LiveOverlay({ classId }: { classId?: string | null } = {}) {
  const state = useLiveSync(classId ?? null);
  if (!state.active) return null;
  if (state.interactive) return <InteractionOverlay state={state} />;
  return <DimOverlay />;
}
