'use client';

import { useEffect, useState, useTransition } from 'react';
import { submitQuizAnswer } from '@/lib/db/quiz-answer-actions';
import { QuizAnswerButtons } from '@/components/student/QuizAnswerButtons';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import type { SafeBlock } from '@/app/api/quiz/question/route';

// Schüler:innen-Frage-Overlay (Phase S2.D + Bugfix Auto-Advance).
// Wird im Live-Quiz angezeigt solange status='active'. Nach Submit wechselt
// es in den Warte-Zustand mit eigenen Punkten — der Polling-Hook (parent)
// ersetzt das Overlay dann automatisch wenn between/lobby kommt.
//
// Lokaler Countdown: ticked sekündlich zwischen Polling-Ticks runter
// (sonst sieht Schüler:in den Countdown nur bei jedem 1s-Poll springen).
// Bei 0 sind Antwort-Buttons disabled + Hinweis „Zeit abgelaufen — warte
// auf Auflösung". Der Server hat die finale Entscheidung — submitQuizAnswer
// lehnt Antworten nach time_limit + 5s Karenz ohnehin ab.

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
  const ticked = useTickingCountdown(remainingSeconds);
  const timeUp = ticked <= 0;
  const submission = useAnswerSubmission({
    sessionId,
    questionIndex,
    ownAnswer,
    disabled: timeUp,
  });

  if (submission.result) {
    return (
      <AnsweredView points={submission.result.points} isCorrect={submission.result.isCorrect} />
    );
  }
  if (timeUp) return <TimeUpView questionIndex={questionIndex} />;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col gap-4 p-4">
      <Countdown remainingSeconds={ticked} questionIndex={questionIndex} />
      <p className="text-center text-xl leading-snug font-semibold">{questionText(block)}</p>
      <QuizAnswerButtons block={block} pending={submission.pending} onSubmit={submission.submit} />
      {submission.error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800"
          role="alert"
        >
          {submission.error}
        </p>
      )}
    </div>
  );
}

type SubmissionState = {
  pending: boolean;
  result: { isCorrect: boolean; points: number } | null;
  error: string | null;
  submit: (answer: BlockAnswer) => void;
};

// Bündelt Submit-Status (pending, localResult, error) und liefert die
// submit-Funktion. ownAnswer (vom Polling) hat Vorrang vor localResult —
// damit überlebt der „Du hast geantwortet"-Screen auch ein Tab-Reload.
function useAnswerSubmission(args: {
  sessionId: string;
  questionIndex: number;
  ownAnswer: { isCorrect: boolean; points: number } | null;
  disabled: boolean;
}): SubmissionState {
  const [pending, startTransition] = useTransition();
  const [localResult, setLocalResult] = useState<{
    isCorrect: boolean;
    points: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const result = args.ownAnswer ?? localResult;

  function submit(answer: BlockAnswer) {
    if (pending || result || args.disabled) return;
    setError(null);
    startTransition(async () => {
      const res = await submitQuizAnswer({
        sessionId: args.sessionId,
        questionIndex: args.questionIndex,
        answer,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setLocalResult({ isCorrect: res.isCorrect, points: res.points });
    });
  }

  return { pending, result, error, submit };
}

// Lokaler Countdown der zwischen Polling-Ticks sekündlich runtertickt.
// Initialwert kommt vom Server (remainingSeconds beim ersten Render);
// der Parent setzt key={questionIndex} → bei neuer Frage wird das ganze
// Overlay neu gemountet, der Countdown startet sauber neu.
//
// Bewusst KEIN sync zurück zum serverValue im Effect (Anti-Pattern in
// React 19). Drift ist max ~1s, das ist ok für 30s-Fragen.
function useTickingCountdown(initialValue: number): number {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (initialValue <= 0) return;
    const id = setInterval(() => {
      setValue((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
    // initialValue bewusst nur beim Mount lesen, Server-Updates ignorieren —
    // der Parent setzt key={questionIndex}, das remounted den Hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

function TimeUpView({ questionIndex }: { questionIndex: number }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl">⏰</p>
      <p className="text-xl font-semibold">Zeit abgelaufen</p>
      <p className="text-muted-foreground text-sm">
        Frage {questionIndex + 1} ist vorbei. Die Auflösung kommt gleich…
      </p>
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
