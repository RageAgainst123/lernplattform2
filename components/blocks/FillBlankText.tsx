'use client';

import type { FillSegment } from '@/lib/blocks/fill-blank';
import { cn } from '@/lib/utils';

type Props = {
  segments: FillSegment[];
  filled: (string | null)[];
  solutions: string[];
  checked: boolean;
  readOnly?: boolean;
  onClear: (index: number) => void;
};

// Klassen pro Lücke:
// - checked && !readOnly: rote/grüne Bewertungs-Optik (Quiz)
// - readOnly && !checked: ausgegraut, ohne Bewertung (Arbeitsblatt nach Abgabe)
// - sonst: Standard (Tipp-Modus)
function slotClass(
  value: string | null,
  solution: string | undefined,
  checked: boolean,
  readOnly: boolean
): string {
  if (checked) {
    const right = value?.trim().toLowerCase() === solution?.trim().toLowerCase();
    return right ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700';
  }
  if (readOnly) {
    return value ? 'border-primary opacity-70' : 'border-dashed opacity-70';
  }
  return value ? 'border-primary' : 'border-dashed';
}

export function FillBlankText({
  segments,
  filled,
  solutions,
  checked,
  readOnly = false,
  onClear,
}: Props) {
  const locked = checked || readOnly;
  return (
    <p className="text-lg leading-relaxed">
      {segments.map((seg, i) =>
        typeof seg === 'string' ? (
          <span key={i}>{seg}</span>
        ) : (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => onClear(seg)}
            className={cn(
              'mx-1 inline-block min-w-20 rounded border-b-2 px-2 align-baseline',
              slotClass(filled[seg], solutions[seg], checked, readOnly)
            )}
          >
            {filled[seg] ?? ' '}
          </button>
        )
      )}
    </p>
  );
}
