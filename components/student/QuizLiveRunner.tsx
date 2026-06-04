'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizQuestionPoll } from '@/components/quiz/useQuizQuestionPoll';
import { QuizQuestionOverlay } from '@/components/student/QuizQuestionOverlay';
import { QuizBetweenWait } from '@/components/student/QuizBetweenWait';
import type { QuizQuestionState } from '@/app/api/quiz/question/route';

// Schüler:innen-Live-Runner (Phase S2.D + S3). Status-bewusster Renderer:
//   • lobby → Warte-Screen
//   • active → QuizQuestionOverlay (Antworten)
//   • between → QuizBetweenWait mit eigenem Rang (Phase S3, Spec §5.6)
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
  if (state.kind === 'between') return <QuizBetweenWait />;
  if (state.kind === 'active') {
    return (
      <QuizQuestionOverlay
        // key erzwingt Remount bei jeder neuen Frage → localResult der
        // vorherigen Antwort wird verworfen. Ohne key bleibt der Schüler
        // im AnsweredView hängen wenn die nächste Frage kommt.
        key={`${state.sessionId}:${state.questionIndex}`}
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
