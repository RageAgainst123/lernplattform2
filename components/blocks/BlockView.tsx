'use client';

import type { ReactNode } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { TextBlock } from '@/components/blocks/TextBlock';
import { InfoboxBlock } from '@/components/blocks/InfoboxBlock';
import { MultipleChoiceBlock } from '@/components/blocks/MultipleChoiceBlock';
import { TrueFalseBlock } from '@/components/blocks/TrueFalseBlock';
import { FillBlankBlock } from '@/components/blocks/FillBlankBlock';
import { MatchBlock } from '@/components/blocks/MatchBlock';
import { CategorizeBlock } from '@/components/blocks/CategorizeBlock';
import { MarkWordsBlock } from '@/components/blocks/MarkWordsBlock';
import { ReflectionBlock } from '@/components/blocks/ReflectionBlock';
import { SlideBlock } from '@/components/blocks/SlideBlock';
import { LivePollBlock } from '@/components/blocks/LivePollBlock';
import {
  QuizPollPreview,
  ScalePreview,
  UnderstandingPreview,
  WordCloudPreview,
} from '@/components/blocks/block-live-previews';

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

// Zuordnungs-/Markier-Blöcke (match, categorize, mark_words) — gemeinsam
// ausgelagert, damit der Haupt-Dispatcher unter der Zeilen-Grenze bleibt.
function renderAssignment(
  block: Extract<Block, { type: 'match' | 'categorize' | 'mark_words' }>,
  p: CommonProps
) {
  if (block.type === 'match') {
    return (
      <MatchBlock
        block={block}
        assignment={(p.answer as Record<string, string>) ?? {}}
        checked={p.checked}
        readOnly={p.readOnly}
        onAssign={p.onAnswer}
      />
    );
  }
  if (block.type === 'categorize') {
    return (
      <CategorizeBlock
        block={block}
        answer={(p.answer as Record<string, string>) ?? {}}
        checked={p.checked}
        readOnly={p.readOnly}
        onAssign={p.onAnswer}
      />
    );
  }
  return (
    <MarkWordsBlock
      block={block}
      answer={(p.answer as number[]) ?? []}
      checked={p.checked}
      readOnly={p.readOnly}
      onMark={p.onAnswer}
    />
  );
}

// Statische/Folien-Blöcke (inkl. interaktiver Live-Block-Vorschauen). Trennt sich
// vom Quiz-Pfad ab, damit der Dispatcher unter der Zeilen-Grenze bleibt.
function renderStatic(block: Block): ReactNode {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'infobox':
      return <InfoboxBlock block={block} />;
    case 'slide':
      return <SlideBlock block={block} />;
    case 'live_poll':
      return <LivePollBlock block={block} />;
    case 'quiz_poll':
      return <QuizPollPreview block={block} />;
    case 'word_cloud':
      return <WordCloudPreview block={block} />;
    case 'scale':
      return <ScalePreview block={block} />;
    case 'understanding':
      return <UnderstandingPreview block={block} />;
    default:
      return null;
  }
}

// Dispatcher: gibt den aktuellen Block an seine Renderer-Komponente weiter,
// übersetzt den generischen `answer` in deren typspezifische Props.
export function BlockView({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const c: CommonProps = { answer, checked, readOnly, onAnswer };
  const staticView = renderStatic(block);
  if (staticView) return staticView;
  switch (block.type) {
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
    case 'categorize':
    case 'mark_words':
      return renderAssignment(block, c);
  }
}
