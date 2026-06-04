'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizQuestionPoll } from '@/components/quiz/useQuizQuestionPoll';
import { QuizQuestionOverlay } from '@/components/student/QuizQuestionOverlay';
import type { QuizQuestionState } from '@/app/api/quiz/question/route';

// Schüler:innen-Live-Runner (Phase S2.D). Status-bewusster Renderer:
//   • lobby → Warte-Screen
//   • active → QuizQuestionOverlay (Antworten)
//   • between → "Auflösung läuft am Beamer"-Screen
//   • none → Redirect zu /s (Quiz beendet)
//
// Polling übernimmt useQuizQuestionPoll. Initial-State kommt server-
// gerendert von der Page (kein Flicker).

type Props = {
  initial: QuizQuestionState;
};

export function QuizLiveRunner({ initial }: Props) {
  const router = useRouter();
  const state = useQuizQuestionPoll(initial);

  useEffect(() => {
    if (state.kind === 'none') router.push('/s');
  }, [state, router]);

  if (state.kind === 'lobby') return <LobbyWait />;
  if (state.kind === 'between') return <BetweenWait />;
  if (state.kind === 'active') {
    return (
      <QuizQuestionOverlay
        block={state.block}
        questionIndex={state.questionIndex}
        sessionId={state.sessionId}
        remainingSeconds={state.remainingSeconds}
        ownAnswer={state.ownAnswer}
      />
    );
  }
  return null;
}

function LobbyWait() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl">⏳</p>
      <p className="text-xl font-semibold">Warte auf den Start…</p>
      <p className="text-muted-foreground text-sm">Deine Lehrer:in startet das Quiz gleich.</p>
    </div>
  );
}

function BetweenWait() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl">🔍</p>
      <p className="text-xl font-semibold">Auflösung am Beamer</p>
      <p className="text-muted-foreground text-sm">
        Schau nach vorne — gleich kommt die nächste Frage.
      </p>
    </div>
  );
}
