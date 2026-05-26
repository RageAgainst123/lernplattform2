'use client';

import type { FillSegment } from '@/lib/blocks/fill-blank';
import { cn } from '@/lib/utils';

type Props = {
  segments: FillSegment[];
  filled: (string | null)[];
  solutions: string[];
  checked: boolean;
  onClear: (index: number) => void;
};

function slotClass(value: string | null, solution: string | undefined, checked: boolean): string {
  if (!checked) {
    return value ? 'border-primary' : 'border-dashed';
  }
  const right = value?.trim().toLowerCase() === solution?.trim().toLowerCase();
  return right ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700';
}

export function FillBlankText({ segments, filled, solutions, checked, onClear }: Props) {
  return (
    <p className="text-lg leading-relaxed">
      {segments.map((seg, i) =>
        typeof seg === 'string' ? (
          <span key={i}>{seg}</span>
        ) : (
          <button
            key={i}
            type="button"
            disabled={checked}
            onClick={() => onClear(seg)}
            className={cn(
              'mx-1 inline-block min-w-20 rounded border-b-2 px-2 align-baseline',
              slotClass(filled[seg], solutions[seg], checked)
            )}
          >
            {filled[seg] ?? ' '}
          </button>
        )
      )}
    </p>
  );
}
