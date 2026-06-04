'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  endQuizSession,
  nextQuizQuestion,
  revealQuizQuestion,
} from '@/lib/db/quiz-session-actions';
import { Button } from '@/components/ui/button';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';

// Lehrer:innen-Steuerung im Beamer-Modus (Phase S2.E).
// Floatet oben rechts: „Auflösen" (active → between_questions), „Nächste
// Frage" (between_questions → active mit current_question_index++) oder
// „Quiz beenden" (immer sichtbar).

type Props = {
  classId: string;
  state: Extract<QuizBeamerState, { kind: 'active' | 'between' }>;
};

export function QuizTeacherControls({ classId, state }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const reveal = () =>
    startTransition(async () => {
      await revealQuizQuestion(classId);
      router.refresh();
    });
  const next = () =>
    startTransition(async () => {
      await nextQuizQuestion(classId);
      router.refresh();
    });
  const end = () => {
    if (!confirm('Quiz wirklich beenden?')) return;
    startTransition(async () => {
      await endQuizSession(classId);
      router.push(`/lehrer/klassen/${classId}`);
    });
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2 rounded-lg bg-white/95 p-3 shadow-2xl ring-1 ring-slate-300">
      <p className="text-center text-xs font-medium tracking-wide text-slate-600 uppercase">
        Steuerung
      </p>
      <PrimaryAction state={state} pending={pending} onReveal={reveal} onNext={next} />
      <Button variant="outline" onClick={end} disabled={pending} className="h-9 text-sm">
        Quiz beenden
      </Button>
    </div>
  );
}

function PrimaryAction({
  state,
  pending,
  onReveal,
  onNext,
}: {
  state: Props['state'];
  pending: boolean;
  onReveal: () => void;
  onNext: () => void;
}) {
  if (state.kind === 'active') {
    return (
      <Button
        onClick={onReveal}
        disabled={pending}
        className="h-10 bg-amber-500 hover:bg-amber-600"
      >
        {pending ? 'Auflöse…' : '🔍 Auflösen'}
      </Button>
    );
  }
  return (
    <Button
      onClick={onNext}
      disabled={pending}
      className="h-10 bg-emerald-600 hover:bg-emerald-700"
    >
      {pending ? 'Lade…' : '▶ Nächste Frage'}
    </Button>
  );
}
