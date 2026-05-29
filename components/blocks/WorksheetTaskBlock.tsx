'use client';

import { BookOpenIcon } from 'lucide-react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { BlockView } from '@/components/blocks/BlockView';

// Eine Karte im Worksheet: interaktiv = „Aufgabe N"-Headline + neutraler
// Rahmen; theoretisch (text/infobox) = gedämpfte Hintergrundfarbe + „Lesen"-
// Label. Sichtbar trennt Lesematerial von Eingabe-Aufgaben.

export type WorksheetTaskBlockProps = {
  block: Block;
  taskNumber: number | null;
  answer: BlockAnswer | undefined;
  readOnly: boolean;
  onAnswer: (value: BlockAnswer) => void;
};

export function WorksheetTaskBlock({
  block,
  taskNumber,
  answer,
  readOnly,
  onAnswer,
}: WorksheetTaskBlockProps) {
  const isTask = taskNumber !== null;
  return (
    <section
      aria-labelledby={`task-${block.id}`}
      className={
        isTask
          ? 'space-y-3 rounded-lg border p-4'
          : 'bg-muted/30 border-muted space-y-3 rounded-lg border p-4'
      }
    >
      {isTask ? (
        <h2
          id={`task-${block.id}`}
          className="text-muted-foreground text-sm font-semibold tracking-wide uppercase"
        >
          Aufgabe {taskNumber}
        </h2>
      ) : (
        <p
          id={`task-${block.id}`}
          className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
        >
          <BookOpenIcon className="size-3.5" aria-hidden />
          Lesen
        </p>
      )}
      <BlockView
        block={block}
        answer={answer}
        checked={false}
        readOnly={readOnly}
        onAnswer={onAnswer}
      />
    </section>
  );
}
