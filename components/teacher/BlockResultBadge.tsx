import { CheckIcon, XIcon, MinusIcon } from 'lucide-react';
import type { BlockResult } from '@/lib/blocks/evaluate';

// Kleines Chip neben einer Aufgabe in der Lehrer:innen-Abgabe-Ansicht:
// grün bei korrekt, rot bei falsch, gelb bei Teilpunkten („3 von 4 richtig").
// Für nicht-bewertbare Blöcke (ungraded) wird nichts gerendert.
//
// `score` (0.0–1.0) wird nur bei result='partial' für die konkrete Anteil-
// Anzeige genutzt. correctCount/total optional für „N von M"-Text.

export function BlockResultBadge({
  result,
  score,
  correctCount,
  total,
}: {
  result: BlockResult;
  score?: number | null;
  correctCount?: number;
  total?: number;
}) {
  if (result === 'ungraded') {
    return null;
  }
  if (result === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckIcon className="size-3.5" aria-hidden />
        Richtig
      </span>
    );
  }
  if (result === 'partial') {
    // „3 von 4 richtig" wenn Counts da, sonst Prozent aus score.
    const label =
      correctCount !== undefined && total !== undefined
        ? `${correctCount} von ${total} richtig`
        : `${Math.round((score ?? 0) * 100)} % richtig`;
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
        <MinusIcon className="size-3.5" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
      <XIcon className="size-3.5" aria-hidden />
      Falsch
    </span>
  );
}
