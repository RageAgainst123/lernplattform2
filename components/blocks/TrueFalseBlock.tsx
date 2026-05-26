'use client';

import type { TrueFalseBlock as TFBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

type Props = {
  block: TFBlockType;
  selected: boolean | null;
  checked: boolean;
  onSelect: (value: boolean) => void;
};

function choiceClass(value: boolean, props: Props): string {
  const { selected, checked, block } = props;
  const isSelected = selected === value;
  if (checked && value === block.answer) {
    return 'border-green-600 bg-green-50';
  }
  if (checked && isSelected && value !== block.answer) {
    return 'border-red-600 bg-red-50';
  }
  return isSelected ? 'border-primary bg-primary/5' : '';
}

export function TrueFalseBlock(props: Props) {
  const { block, checked, onSelect } = props;
  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{block.question}</p>
      <div className="flex gap-3">
        {([true, false] as const).map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={checked}
            onClick={() => onSelect(value)}
            className={cn(
              'h-14 flex-1 rounded-md border text-lg font-medium',
              choiceClass(value, props)
            )}
          >
            {value ? 'Wahr' : 'Falsch'}
          </button>
        ))}
      </div>
    </div>
  );
}
