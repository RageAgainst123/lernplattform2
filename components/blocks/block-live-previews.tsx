'use client';

import type {
  QuizPollBlock as QuizPollBlockType,
  ScaleBlock as ScaleBlockType,
  UnderstandingBlock as UnderstandingBlockType,
  WordCloudBlock as WordCloudBlockType,
} from '@/lib/schemas/blocks';

// Statische Admin-Vorschauen für die interaktiven Live-Block-Typen — keine
// Beamer-Polling-Logik, nur die Frage + die Auswahlmöglichkeiten als Karten,
// damit Lehrer:innen den Modul-Inhalt sehen können bevor sie präsentieren.
// Ausgelagert aus BlockView.tsx (Zeilen-Limit).

export function QuizPollPreview({ block }: { block: QuizPollBlockType }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <h3 className="text-2xl font-bold">{block.question}</h3>
      <ul className="flex flex-col gap-2">
        {block.options.map((o) => (
          <li
            key={o.id}
            className={`bg-muted rounded-md px-4 py-3 ${o.correct ? 'border-l-4 border-green-500' : ''}`}
          >
            {o.text}
            {o.correct && <span className="text-muted-foreground ml-2 text-xs">(richtig)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WordCloudPreview({ block }: { block: WordCloudBlockType }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <h3 className="text-2xl font-bold">{block.question}</h3>
      <p className="text-muted-foreground text-sm">
        Wortwolke — Schüler:innen tippen Freitext (max 40 Zeichen).
      </p>
    </div>
  );
}

export function ScalePreview({ block }: { block: ScaleBlockType }) {
  const steps = Array.from({ length: block.max - block.min + 1 }, (_, i) => block.min + i);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <h3 className="text-2xl font-bold">{block.question}</h3>
      <div className="flex items-center gap-2">
        {steps.map((v) => (
          <span key={v} className="bg-muted rounded-md px-4 py-2 font-semibold">
            {v}
          </span>
        ))}
      </div>
      {(block.minLabel ?? block.maxLabel) && (
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>{block.minLabel ?? ''}</span>
          <span>{block.maxLabel ?? ''}</span>
        </div>
      )}
    </div>
  );
}

export function UnderstandingPreview({ block }: { block: UnderstandingBlockType }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <h3 className="text-2xl font-bold">{block.question ?? 'Wie gut hast du das verstanden?'}</h3>
      <div className="flex gap-2">
        <span className="bg-muted rounded-md px-4 py-2">🟢 Verstanden</span>
        <span className="bg-muted rounded-md px-4 py-2">🟡 Unsicher</span>
        <span className="bg-muted rounded-md px-4 py-2">🔴 Noch nicht</span>
      </div>
    </div>
  );
}
