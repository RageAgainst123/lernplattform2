import { CheckIcon, XIcon } from 'lucide-react';
import type { BlockResult } from '@/lib/blocks/evaluate';

// Kleines Chip neben einer Aufgabe in der Lehrer:innen-Abgabe-Ansicht:
// grün bei korrekt, rot bei falsch. Für nicht-bewertbare Blöcke (ungraded)
// wird nichts gerendert.

export function BlockResultBadge({ result }: { result: BlockResult }) {
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
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
      <XIcon className="size-3.5" aria-hidden />
      Falsch
    </span>
  );
}
