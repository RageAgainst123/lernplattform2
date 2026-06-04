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

// Lehrer:innen-Steuerung im Beamer-Modus (Phase S2.E + S3).
// Floatet oben rechts: „Auflösen" (active → between_questions), „Nächste
// Frage" (between_questions → active mit current_question_index++),
// „Leaderboard zeigen/Auflösung zeigen"-Toggle nur in between (S3,
// Spec §5.6 — rein clientseitiger Switch, kein DB-Status) und
// „Quiz beenden" (immer sichtbar).

type Props = {
  classId: string;
  state: Extract<QuizBeamerState, { kind: 'active' | 'between' }>;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  /**
   * Phase T3-bugfix: nach erfolgreicher server-action sofort den hook-state
   * refetchen. ohne das wartet der lehrer-tab auf den realtime-roundtrip
   * (oder schlimmer: polling-tick), waehrend schueler-tabs die neue frage
   * schon sehen. liefert async damit wir bis zum frischen state warten
   * koennen, bevor der spinner verschwindet.
   */
  onActionDone: () => Promise<void>;
};

export function QuizTeacherControls({
  classId,
  state,
  showLeaderboard,
  onToggleLeaderboard,
  onActionDone,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const reveal = () =>
    startTransition(async () => {
      await revealQuizQuestion(classId);
      await onActionDone();
    });
  const next = () =>
    startTransition(async () => {
      await nextQuizQuestion(classId);
      await onActionDone();
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
      {state.kind === 'between' && (
        <Button
          variant="outline"
          onClick={onToggleLeaderboard}
          disabled={pending}
          className="h-9 text-sm"
        >
          {showLeaderboard ? '🔍 Auflösung zeigen' : '🏆 Leaderboard zeigen'}
        </Button>
      )}
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
