'use client';

import type { Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';
import { BlockFeedback } from '@/components/blocks/BlockFeedback';
import { HintBox } from '@/components/blocks/HintBox';
import { ProgressBar } from '@/components/blocks/ProgressBar';
import { useModuleRunner } from '@/components/blocks/useModuleRunner';
import { TestResultCard } from '@/components/admin/student-test-result';

// Quiz-Test im Editor: bildet die echte Schüler-Sicht (ModuleRunner) nach,
// ABER ohne Routing/DB — nutzt denselben useModuleRunner-Hook (gleiche Logik,
// Prüfen/Nochmal/Weiter, Punkte). Beim „Fertig" zeigt es eine lokale
// Ergebnis-Box statt zur /s/modul/.../done-Route zu navigieren.

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

type Runner = ReturnType<typeof useModuleRunner>;

// Prüfen / Nochmal versuchen / Weiter / Fertig — identisch zum echten Runner.
function QuizActionButton({ runner, onFinish }: { runner: Runner; onFinish: () => void }) {
  if (runner.needsCheck) {
    return (
      <Button data-testid="test-quiz-check" onClick={runner.check} className="h-12 px-8 text-lg">
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
    <Button
      data-testid="test-quiz-next"
      onClick={() => (runner.isLast ? onFinish() : runner.next())}
      className="h-12 px-8 text-lg"
    >
      {runner.isLast ? 'Fertig' : 'Weiter'}
    </Button>
  );
}

export function StudentTestQuiz({
  blocks,
  done,
  onFinish,
  onReset,
}: {
  blocks: Block[];
  done: boolean;
  onFinish: (score: number, max: number) => void;
  onReset: () => void;
}) {
  // key-Reset von außen (onReset ändert den key) setzt den Hook-State zurück.
  const runner = useModuleRunner({ blocks, startIndex: 0, initialAnswers: {} });

  if (done) {
    return <TestResultCard score={runner.score()} max={runner.maxScore()} onReset={onReset} />;
  }

  const hint = getHint(runner.block);
  return (
    <div data-testid="test-quiz" className="mx-auto flex max-w-xl flex-col gap-6 p-2">
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
        <QuizActionButton
          runner={runner}
          onFinish={() => onFinish(runner.score(), runner.maxScore())}
        />
      </div>
    </div>
  );
}
