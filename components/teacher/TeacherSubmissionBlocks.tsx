'use client';

import type { Block } from '@/lib/schemas/blocks';
import { blockResult, blockScore, isGraded, type BlockAnswer } from '@/lib/blocks/evaluate';
import { BlockView } from '@/components/blocks/BlockView';
import { BlockResultBadge } from '@/components/teacher/BlockResultBadge';
import { buildTaskNumberMap } from '@/components/blocks/worksheet-task-numbers';

// Read-only-Ansicht einer Schüler:innen-Abgabe für Lehrer:innen. Rendert jeden
// Block über den bestehenden BlockView mit checked=true + readOnly=true → die
// vorhandenen Renderer zeigen damit die grün/rot-Optik UND sperren die Eingabe.
// Auto-bewertbare Blöcke bekommen zusätzlich ein Richtig/Falsch-Chip; Reflexion
// ein manuelles Häkchen (akzeptiert/nicht), das die Lehrer:in selbst setzt.

const noop = () => {};

type Props = {
  blocks: Block[];
  answers: Record<string, BlockAnswer>;
  manualMarks: Record<string, boolean>;
  onToggleMark: (blockId: string, accepted: boolean) => void;
};

function ReflectionMark({
  blockId,
  accepted,
  onToggle,
}: {
  blockId: string;
  accepted: boolean;
  onToggle: (blockId: string, accepted: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4"
        checked={accepted}
        onChange={(e) => onToggle(blockId, e.target.checked)}
      />
      Antwort akzeptiert
    </label>
  );
}

function SubmissionBlock({
  block,
  taskNumber,
  answer,
  manualMarks,
  onToggleMark,
}: {
  block: Block;
  taskNumber: number | null;
  answer: BlockAnswer | undefined;
  manualMarks: Record<string, boolean>;
  onToggleMark: (blockId: string, accepted: boolean) => void;
}) {
  const result = blockResult(block, answer);
  const score = blockScore(block, answer);
  return (
    <div className="space-y-2 border-b pb-5 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        {taskNumber !== null ? (
          <div className="text-muted-foreground text-sm font-semibold">Aufgabe {taskNumber}</div>
        ) : (
          <span />
        )}
        <BlockResultBadge result={result} score={score} />
      </div>
      <BlockView block={block} answer={answer} checked readOnly onAnswer={noop} />
      {block.type === 'reflection' && (
        <ReflectionMark
          blockId={block.id}
          accepted={manualMarks[block.id] ?? false}
          onToggle={onToggleMark}
        />
      )}
    </div>
  );
}

export function TeacherSubmissionBlocks({ blocks, answers, manualMarks, onToggleMark }: Props) {
  const taskNumbers = buildTaskNumberMap(blocks);
  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        const numbered = isGraded(block) || block.type === 'reflection';
        return (
          <SubmissionBlock
            key={block.id}
            block={block}
            taskNumber={numbered ? (taskNumbers.get(block.id) ?? null) : null}
            answer={answers[block.id]}
            manualMarks={manualMarks}
            onToggleMark={onToggleMark}
          />
        );
      })}
    </div>
  );
}
