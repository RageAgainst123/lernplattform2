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
import { ReflectionBlock } from '@/components/blocks/ReflectionBlock';
import { SlideBlock } from '@/components/blocks/SlideBlock';
import { LivePollBlock } from '@/components/blocks/LivePollBlock';
import type {
  QuizPollBlock as QuizPollBlockType,
  WordCloudBlock as WordCloudBlockType,
  ScaleBlock as ScaleBlockType,
  UnderstandingBlock as UnderstandingBlockType,
} from '@/lib/schemas/blocks';

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

// Statische Admin-Vorschauen für die interaktiven Live-Block-Typen — keine
// Beamer-Polling-Logik, nur die Frage + die Auswahlmöglichkeiten als Karten,
// damit Lehrer:innen den Modul-Inhalt sehen können bevor sie präsentieren.
function QuizPollPreview({ block }: { block: QuizPollBlockType }) {
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

function WordCloudPreview({ block }: { block: WordCloudBlockType }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <h3 className="text-2xl font-bold">{block.question}</h3>
      <p className="text-muted-foreground text-sm">
        Wortwolke — Schüler:innen tippen Freitext (max 40 Zeichen).
      </p>
    </div>
  );
}

function ScalePreview({ block }: { block: ScaleBlockType }) {
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

function UnderstandingPreview({ block }: { block: UnderstandingBlockType }) {
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
