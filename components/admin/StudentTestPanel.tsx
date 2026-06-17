'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { maxScore, scoreModule } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';
import { WorksheetTaskBlock } from '@/components/blocks/WorksheetTaskBlock';
import { buildTaskNumberMap } from '@/components/blocks/worksheet-task-numbers';
import { TestResultCard } from '@/components/admin/student-test-result';
import { StudentTestQuiz } from '@/components/admin/student-test-quiz';

// „Als Schüler:in testen"-Tab im Modul-Editor. Spielt das Modul EXAKT so durch,
// wie die Schüler:in es bekommt — Worksheet-Modul → Worksheet-Erlebnis (alle
// Aufgaben auf einer Seite, „Abgeben"), Quiz-Modul → Block-für-Block mit
// „Prüfen/Weiter". KEINE DB-Schreibung, KEIN Routing, kein Login, kein 2. Tab.
// Nach „Abgeben"/„Fertig" eine simulierte Score-Auswertung + Neu-starten.

type DisplayMode = 'worksheet' | 'quiz';

// Worksheet-Test: nutzt denselben WorksheetTaskBlock-Renderer + Nummerierung
// wie die echte Schüler-Sicht, aber mit lokalem State statt Auto-Save.
function WorksheetTest({
  blocks,
  done,
  onSubmit,
  onReset,
}: {
  blocks: Block[];
  done: boolean;
  onSubmit: (score: number, max: number) => void;
  onReset: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, BlockAnswer>>({});
  const taskNumbers = buildTaskNumberMap(blocks);

  if (done) {
    return (
      <TestResultCard
        score={scoreModule(blocks, answers)}
        max={maxScore(blocks)}
        onReset={onReset}
      />
    );
  }

  return (
    <div data-testid="test-worksheet" className="mx-auto max-w-2xl space-y-6 py-4">
      {blocks.map((block) => (
        <WorksheetTaskBlock
          key={block.id}
          block={block}
          taskNumber={taskNumbers.get(block.id) ?? null}
          answer={answers[block.id]}
          readOnly={false}
          onAnswer={(value) => setAnswers((prev) => ({ ...prev, [block.id]: value }))}
        />
      ))}
      <div className="flex justify-end pt-2">
        <Button
          data-testid="test-worksheet-submit"
          size="lg"
          onClick={() => onSubmit(scoreModule(blocks, answers), maxScore(blocks))}
        >
          Abgeben (Test)
        </Button>
      </div>
    </div>
  );
}

export function StudentTestPanel({
  blocks,
  displayMode,
}: {
  blocks: Block[];
  displayMode: DisplayMode;
}) {
  // runKey erzwingt beim „Neu starten" einen frischen Mount (State-Reset).
  const [runKey, setRunKey] = useState(0);
  const [done, setDone] = useState(false);

  function reset() {
    setDone(false);
    setRunKey((k) => k + 1);
  }

  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Füge Blöcke hinzu, um das Modul als Schüler:in zu testen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        🎒 So sieht es die Schüler:in ({displayMode === 'worksheet' ? 'Arbeitsblatt' : 'Quiz'}
        -Modus). Nichts wird gespeichert — reiner Test.
      </p>
      <div className="rounded-lg border p-4">
        {displayMode === 'quiz' ? (
          <StudentTestQuiz
            key={runKey}
            blocks={blocks}
            done={done}
            onFinish={() => setDone(true)}
            onReset={reset}
          />
        ) : (
          <WorksheetTest
            key={runKey}
            blocks={blocks}
            done={done}
            onSubmit={() => setDone(true)}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}
