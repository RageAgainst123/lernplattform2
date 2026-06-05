'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';
import { BlockFeedback } from '@/components/blocks/BlockFeedback';
import { HintBox } from '@/components/blocks/HintBox';
import { ProgressBar } from '@/components/blocks/ProgressBar';
import { useModuleRunner } from '@/components/blocks/useModuleRunner';
import { stashSoloRunResult } from '@/lib/blocks/solo-run-result';

// Phase W: Pure Helper — zieht den Hint-Text aus einem Block, falls dieser
// einen Hint-Eintrag hat (nur graded Blöcke haben das Schema-Feld).
function getHint(block: Block): string | undefined {
  if (
    block.type === 'multiple_choice' ||
    block.type === 'true_false' ||
    block.type === 'fill_blank' ||
    block.type === 'match'
  ) {
    return block.hint;
  }
  return undefined;
}

type SaveArgs = {
  blockIndex: number;
  answers: Record<string, BlockAnswer>;
  score: number;
  done: boolean;
};

type Runner = ReturnType<typeof useModuleRunner>;

type Props = {
  moduleId: string;
  blocks: Block[];
  startIndex: number;
  initialAnswers: Record<string, BlockAnswer>;
  onSave: (args: SaveArgs) => Promise<void>;
};

// Beim „Weiter"/„Fertig" speichern + (falls Endseite) Solo-Punkte in
// sessionStorage legen, damit die Endseite sie anzeigen kann (R1.3).
async function persistAndAdvance(runner: Runner, moduleId: string, onSave: Props['onSave']) {
  const done = runner.isLast;
  const blockIndex = done ? runner.index : runner.index + 1;
  await onSave({ blockIndex, answers: runner.answers, score: runner.score(), done });
  if (!done) {
    runner.next();
    return false;
  }
  stashSoloRunResult(moduleId, {
    totalPoints: runner.totalPoints(),
    longestStreak: runner.longestStreak(),
    pointsByBlock: runner.pointsByBlock,
  });
  return true;
}

// Phase W: Action-Button auf Basis des Runner-States (Prüfen/Retry/Weiter).
function ActionButton({
  runner,
  pending,
  onNext,
}: {
  runner: ReturnType<typeof useModuleRunner>;
  pending: boolean;
  onNext: () => void;
}) {
  if (runner.needsCheck) {
    return (
      <Button onClick={runner.check} className="h-12 px-8 text-lg">
        Prüfen
      </Button>
    );
  }
  if (runner.canRetry) {
    return (
      <Button onClick={runner.retry} variant="secondary" className="h-12 px-8 text-lg">
        Nochmal versuchen
      </Button>
    );
  }
  return (
    <Button onClick={onNext} disabled={pending} className="h-12 px-8 text-lg">
      {runner.isLast ? 'Fertig' : 'Weiter'}
    </Button>
  );
}

export function ModuleRunner({ moduleId, blocks, startIndex, initialAnswers, onSave }: Props) {
  const runner = useModuleRunner({ blocks, startIndex, initialAnswers });
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleNext() {
    startTransition(async () => {
      const done = await persistAndAdvance(runner, moduleId, onSave);
      if (done) router.push(`/s/modul/${moduleId}/done`);
    });
  }

  const hint = getHint(runner.block);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <ProgressBar current={runner.index} total={runner.total} />
      <div className="space-y-4">
        <BlockView
          block={runner.block}
          answer={runner.answers[runner.block.id]}
          checked={runner.checked}
          onAnswer={runner.setAnswer}
        />
        {runner.checked && <BlockFeedback block={runner.block} correct={runner.correct} />}
        {runner.canRetry && hint && (
          <HintBox hint={hint} attemptsLeft={runner.maxAttempts - runner.attemptCount} />
        )}
      </div>
      <div className="flex justify-end">
        <ActionButton runner={runner} pending={pending} onNext={handleNext} />
      </div>
    </div>
  );
}
