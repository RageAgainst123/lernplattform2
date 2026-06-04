'use client';

import { useState, useTransition } from 'react';
import { submitQuizAnswer } from '@/lib/db/quiz-answer-actions';
import { QuizAnswerButtons } from '@/components/student/QuizAnswerButtons';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import type { SafeBlock } from '@/app/api/quiz/question/route';

// Schüler:innen-Frage-Overlay (Phase S2.D). Wird im Live-Quiz angezeigt,
// solange status='active'. Nach Submit wechselt es in den Warte-Zustand
// mit eigenen Punkten — der Polling-Hook (parent) ersetzt das Overlay
// dann automatisch wenn between/lobby kommt.

type Props = {
  block: SafeBlock;
  questionIndex: number;
  sessionId: string;
  remainingSeconds: number;
  ownAnswer: { isCorrect: boolean; points: number } | null;
};

export function QuizQuestionOverlay({
  block,
  questionIndex,
  sessionId,
  remainingSeconds,
  ownAnswer,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [localResult, setLocalResult] = useState<{
    isCorrect: boolean;
    points: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Eigene Antwort schon im Polling-State (vom Server) ODER lokal gerade
  // submitted (optimistic) → wir zeigen den Warte-Bildschirm.
  const result = ownAnswer ?? localResult;

  function submit(answer: BlockAnswer) {
    if (pending || result) return;
    setError(null);
    startTransition(async () => {
      const res = await submitQuizAnswer({ sessionId, questionIndex, answer });
      if (res.error) {
        setError(res.error);
        return;
      }
      setLocalResult({ isCorrect: res.isCorrect, points: res.points });
    });
  }

  if (result) {
    return <AnsweredView points={result.points} isCorrect={result.isCorrect} />;
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col gap-4 p-4">
      <Countdown remainingSeconds={remainingSeconds} questionIndex={questionIndex} />
      <p className="text-center text-xl leading-snug font-semibold">{questionText(block)}</p>
      <QuizAnswerButtons block={block} pending={pending} onSubmit={submit} />
      {error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Countdown({
  remainingSeconds,
  questionIndex,
}: {
  remainingSeconds: number;
  questionIndex: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        Frage {questionIndex + 1}
      </p>
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold tabular-nums ${
          remainingSeconds <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {remainingSeconds}
      </span>
    </div>
  );
}

function AnsweredView({ points, isCorrect }: { points: number; isCorrect: boolean }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className={`text-6xl font-bold ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isCorrect ? '✓' : '✗'}
      </p>
      <p className="text-2xl font-semibold">{isCorrect ? 'Richtig!' : 'Leider falsch'}</p>
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-6 py-4">
        <p className="text-xs text-amber-900 uppercase">+ Punkte</p>
        <p className="text-3xl font-bold text-amber-900 tabular-nums">
          {points.toLocaleString('de-AT')}
        </p>
      </div>
      <p className="text-muted-foreground mt-4 text-sm">⏳ Warte auf andere…</p>
    </div>
  );
}

function questionText(block: SafeBlock): string {
  if (block.type === 'multiple_choice' || block.type === 'true_false') return block.question;
  return block.text;
}
