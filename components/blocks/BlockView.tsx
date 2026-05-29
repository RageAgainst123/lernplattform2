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

type CommonProps = {
  answer: BlockAnswer | undefined;
  checked: boolean;
  readOnly: boolean;
  onAnswer: (answer: BlockAnswer) => void;
};

type Props = {
  block: Block;
  answer: BlockAnswer | undefined;
  // `checked`: Quiz-Modus, Eingabe abgegeben → rote/grüne Bewertungs-Optik.
  checked: boolean;
  // `readOnly`: Arbeitsblatt-Modus nach Abgabe → Inputs gesperrt, KEINE Bewertung.
  readOnly?: boolean;
  onAnswer: (answer: BlockAnswer) => void;
};

function renderMC(block: Extract<Block, { type: 'multiple_choice' }>, p: CommonProps) {
  const selected = (p.answer as string[]) ?? [];
  return (
    <MultipleChoiceBlock
      block={block}
      selected={selected}
      checked={p.checked}
      readOnly={p.readOnly}
      onToggle={(id) =>
        p.onAnswer(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
      }
    />
  );
}

function renderFillBlank(block: Extract<Block, { type: 'fill_blank' }>, p: CommonProps) {
  const filled = (p.answer as (string | null)[]) ?? block.solutions.map(() => null);
  return (
    <FillBlankBlock
      block={block}
      filled={filled}
      checked={p.checked}
      readOnly={p.readOnly}
      onFill={p.onAnswer}
    />
  );
}

// Dispatcher: gibt den aktuellen Block an seine Renderer-Komponente weiter,
// übersetzt den generischen `answer` in deren typspezifische Props.
export function BlockView({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const c: CommonProps = { answer, checked, readOnly, onAnswer };
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'infobox':
      return <InfoboxBlock block={block} />;
    case 'reflection':
      return (
        <ReflectionBlock
          block={block}
          value={(answer as string) ?? ''}
          readOnly={readOnly}
          onChange={onAnswer}
        />
      );
    case 'multiple_choice':
      return renderMC(block, c);
    case 'true_false':
      return (
        <TrueFalseBlock
          block={block}
          selected={(answer as boolean) ?? null}
          checked={checked}
          readOnly={readOnly}
          onSelect={onAnswer}
        />
      );
    case 'fill_blank':
      return renderFillBlank(block, c);
    case 'match':
      return (
        <MatchBlock
          block={block}
          assignment={(answer as Record<string, string>) ?? {}}
          checked={checked}
          readOnly={readOnly}
          onAssign={onAnswer}
        />
      );
  }
}
