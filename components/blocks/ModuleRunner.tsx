'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';
import { BlockFeedback } from '@/components/blocks/BlockFeedback';
import { ProgressBar } from '@/components/blocks/ProgressBar';
import { useModuleRunner } from '@/components/blocks/useModuleRunner';
import { stashSoloRunResult } from '@/lib/blocks/solo-run-result';

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

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-6">
      <ProgressBar current={runner.index} total={runner.total} />

      <div className="flex-1 space-y-4">
        <BlockView
          block={runner.block}
          answer={runner.answers[runner.block.id]}
          checked={runner.checked}
          onAnswer={runner.setAnswer}
        />
        {runner.checked && <BlockFeedback block={runner.block} correct={runner.correct} />}
      </div>

      <div className="flex justify-end">
        {runner.needsCheck ? (
          <Button onClick={runner.check} className="h-12 px-8 text-lg">
            Prüfen
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={pending} className="h-12 px-8 text-lg">
            {runner.isLast ? 'Fertig' : 'Weiter'}
          </Button>
        )}
      </div>
    </div>
  );
}
