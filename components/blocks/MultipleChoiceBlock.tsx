'use client';

import type { MultipleChoiceBlock as MCBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Props = {
  block: MCBlockType;
  selected: string[];
  checked: boolean;
  onToggle: (optionId: string) => void;
};

export function MultipleChoiceBlock({ block, selected, checked, onToggle }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.question}</p>
      <ul className="space-y-2">
        {block.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const showCorrect = checked && opt.correct;
          const showWrong = checked && isSelected && !opt.correct;
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={checked}
                onClick={() => onToggle(opt.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border p-3 text-left text-lg',
                  isSelected && !checked && 'border-primary bg-primary/5',
                  showCorrect && 'border-green-600 bg-green-50',
                  showWrong && 'border-red-600 bg-red-50'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded border',
                    isSelected && 'bg-primary text-primary-foreground'
                  )}
                >
                  {isSelected ? '✓' : ''}
                </span>
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
