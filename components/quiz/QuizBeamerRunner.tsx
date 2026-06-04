'use client';

import { QuizLobbyPolling } from '@/components/quiz/QuizLobbyPolling';
import { QuizQuestionBeamer } from '@/components/quiz/QuizQuestionBeamer';
import { QuizRevealBeamer } from '@/components/quiz/QuizRevealBeamer';
import { useQuizBeamerPoll } from '@/components/quiz/useQuizBeamerPoll';
import { QuizTeacherControls } from '@/components/quiz/QuizTeacherControls';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';
import type { TeacherLobbyState } from '@/app/api/quiz/lobby/route';

// Beamer-Runner für die Lehrer:innen-Sicht (Phase S2.C+E).
// Status-bewusster Renderer: zeigt Lobby ODER Frage ODER Reveal je nach
// quiz_sessions.status. Polling läuft via useQuizBeamerPoll —
// QuizLobbyPolling als Fallback für die Lobby-Phase (eigenes Polling).
//
// kind='none' → vermutlich Quiz beendet → QuizLobbyPolling wickelt das ab
// (navigiert zurück zu /lehrer/klassen/[id]).

type Props = {
  classId: string;
  moduleTitle: string;
  teamMode: boolean;
  initialBeamer: QuizBeamerState;
  initialLobby: TeacherLobbyState;
};

export function QuizBeamerRunner({
  classId,
  moduleTitle,
  teamMode,
  initialBeamer,
  initialLobby,
}: Props) {
  const state = useQuizBeamerPoll(classId, initialBeamer);

  // Lobby-Phase: nimm den bestehenden QuizLobbyPolling-Wrapper.
  if (state.kind === 'none' || state.kind === 'lobby') {
    return (
      <QuizLobbyPolling
        classId={classId}
        moduleTitle={moduleTitle}
        teamMode={teamMode}
        initial={initialLobby}
      />
    );
  }

  // Frage- oder Reveal-Phase.
  return (
    <div className="relative">
      {state.kind === 'active' ? (
        <QuizQuestionBeamer state={state.question} />
      ) : (
        <QuizRevealBeamer state={state.question} />
      )}
      {/* Lehrer:innen-Controls overlay rechts unten (S2.E). */}
      <QuizTeacherControls classId={classId} state={state} />
    </div>
  );
}
