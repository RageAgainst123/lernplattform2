'use client';

import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { TextBlock } from '@/components/blocks/TextBlock';
import { InfoboxBlock } from '@/components/blocks/InfoboxBlock';
import { MultipleChoiceBlock } from '@/components/blocks/MultipleChoiceBlock';
import { TrueFalseBlock } from '@/components/blocks/TrueFalseBlock';
import { FillBlankBlock } from '@/components/blocks/FillBlankBlock';
import { MatchBlock } from '@/components/blocks/MatchBlock';
import { ReflectionBlock } from '@/components/blocks/ReflectionBlock';

type Props = {
  block: Block;
  answer: BlockAnswer | undefined;
  checked: boolean;
  onAnswer: (answer: BlockAnswer) => void;
};

// Dispatcht den aktuellen Block auf die passende Renderer-Komponente und
// übersetzt den generischen Antwort-Wert in deren typspezifische Props.
export function BlockView({ block, answer, checked, onAnswer }: Props) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'infobox':
      return <InfoboxBlock block={block} />;
    case 'reflection':
      return <ReflectionBlock block={block} value={(answer as string) ?? ''} onChange={onAnswer} />;
    case 'multiple_choice': {
      const selected = (answer as string[]) ?? [];
      return (
        <MultipleChoiceBlock
          block={block}
          selected={selected}
          checked={checked}
          onToggle={(id) =>
            onAnswer(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
          }
        />
      );
    }
    case 'true_false':
      return (
        <TrueFalseBlock
          block={block}
          selected={(answer as boolean) ?? null}
          checked={checked}
          onSelect={onAnswer}
        />
      );
    case 'fill_blank': {
      const filled = (answer as (string | null)[]) ?? block.solutions.map(() => null);
      return <FillBlankBlock block={block} filled={filled} checked={checked} onFill={onAnswer} />;
    }
    case 'match':
      return (
        <MatchBlock
          block={block}
          assignment={(answer as Record<string, string>) ?? {}}
          checked={checked}
          onAssign={onAnswer}
        />
      );
  }
}
