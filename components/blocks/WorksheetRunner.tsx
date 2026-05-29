'use client';

import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';
import { WorksheetStatusBanner } from '@/components/blocks/WorksheetStatusBanner';
import { WorksheetTaskBlock } from '@/components/blocks/WorksheetTaskBlock';
import { useWorksheetState } from '@/components/blocks/useWorksheetState';
import { buildTaskNumberMap } from '@/components/blocks/worksheet-task-numbers';

// Arbeitsblatt-Modus: alle Blöcke auf einer scrollbaren Seite. Auto-Save
// im Hintergrund (debounced). Definitive Abgabe via „Abgeben"-Button →
// danach Read-only. Keine Sofort-Bewertung (rote/grüne Markierung).

type Props = {
  blocks: Block[];
  initialAnswers: Record<string, BlockAnswer>;
  // Wenn nicht null → Read-only-Modus (Schüler:in hat bereits abgegeben).
  initialSubmittedAt: string | null;
  onSaveDraft: (answers: Record<string, BlockAnswer>) => Promise<void>;
  onSubmit: (answers: Record<string, BlockAnswer>) => Promise<void>;
};

function WorksheetBlockList({
  blocks,
  answers,
  readOnly,
  updateAnswer,
}: {
  blocks: Block[];
  answers: Record<string, BlockAnswer>;
  readOnly: boolean;
  updateAnswer: (blockId: string, value: BlockAnswer) => void;
}) {
  const taskNumberMap = buildTaskNumberMap(blocks);
  return (
    <>
      {blocks.map((block) => (
        <WorksheetTaskBlock
          key={block.id}
          block={block}
          taskNumber={taskNumberMap.get(block.id) ?? null}
          answer={answers[block.id]}
          readOnly={readOnly}
          onAnswer={(value) => updateAnswer(block.id, value)}
        />
      ))}
    </>
  );
}

export function WorksheetRunner({
  blocks,
  initialAnswers,
  initialSubmittedAt,
  onSaveDraft,
  onSubmit,
}: Props) {
  const s = useWorksheetState(initialAnswers, initialSubmittedAt, onSaveDraft, onSubmit);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <WorksheetStatusBanner
        submittedAt={initialSubmittedAt}
        saveState={s.saveState}
        lastSavedAt={s.lastSavedAt}
      />
      <WorksheetBlockList
        blocks={blocks}
        answers={s.answers}
        readOnly={s.readOnly}
        updateAnswer={s.updateAnswer}
      />
      {s.error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {s.error}
        </p>
      )}
      {!s.readOnly && (
        <div className="flex justify-end pt-4">
          <Button onClick={s.handleSubmit} disabled={s.submitting} size="lg">
            {s.submitting ? 'Wird abgegeben…' : 'Abgeben'}
          </Button>
        </div>
      )}
    </div>
  );
}
