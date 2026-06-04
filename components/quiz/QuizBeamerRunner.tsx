'use client';

import { useState } from 'react';
import { QuizLobbyPolling } from '@/components/quiz/QuizLobbyPolling';
import { QuizQuestionBeamer } from '@/components/quiz/QuizQuestionBeamer';
import { QuizRevealBeamer } from '@/components/quiz/QuizRevealBeamer';
import { QuizLeaderboardBeamer } from '@/components/quiz/QuizLeaderboardBeamer';
import { QuizPodestBeamer } from '@/components/quiz/QuizPodestBeamer';
import { useQuizBeamerPoll } from '@/components/quiz/useQuizBeamerPoll';
import { QuizTeacherControls } from '@/components/quiz/QuizTeacherControls';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';
import type { TeacherLobbyState } from '@/app/api/quiz/lobby/route';

// Beamer-Runner für die Lehrer:innen-Sicht (Phase S2.C+E + S3 + S4).
// Status-bewusster Renderer: zeigt Lobby ODER Frage ODER Reveal ODER
// Podest je nach quiz_sessions.status. Polling läuft via useQuizBeamerPoll
// — QuizLobbyPolling als Fallback für die Lobby-Phase (eigenes Polling).
//
// Phase S3 (Spec §5.6): Im between_questions-Status kann Lehrer:in zwischen
// Reveal-Bildschirm und Leaderboard hin- und herschalten (rein clientseitig,
// kein DB-Statuswechsel). Beim Wechsel auf eine neue Frage (active) wird der
// Leaderboard-Toggle automatisch zurückgesetzt.
//
// Phase S4 (Spec §5.7): kind='ended' rendert das Podest mit 🥇🥈🥉 für
// 5 Min nach endQuizSession, danach Auto-Redirect.
//
// kind='none' → kein Quiz, kein recently-ended → QuizLobbyPolling
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
  const [showLeaderboardRaw, setShowLeaderboard] = useState(false);
  // Effective toggle: nur in between gilt der User-Wunsch. In active wird
  // immer die Frage gezeigt, in lobby ohnehin nicht relevant. Damit
  // verschwindet das Leaderboard automatisch beim Frage-Wechsel, ohne
  // setState-im-Effect (React-19-Anti-Pattern).
  const showLeaderboard = state.kind === 'between' && showLeaderboardRaw;

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

  // Phase S4: Quiz beendet → Podest mit Confetti, kein Lehrer:innen-Controls
  // mehr nötig (eigener „Zurück zur Klasse"-Button im Podest).
  if (state.kind === 'ended') {
    return <QuizPodestBeamer classId={classId} />;
  }

  // Frage- oder Reveal-Phase.
  return (
    <div className="relative">
      <BeamerView state={state} showLeaderboard={showLeaderboard} classId={classId} />
      <QuizTeacherControls
        classId={classId}
        state={state}
        showLeaderboard={showLeaderboard}
        onToggleLeaderboard={() => setShowLeaderboard((v) => !v)}
      />
    </div>
  );
}

// Auswahl der Beamer-Hauptansicht je nach Status + Leaderboard-Toggle.
// Während 'active' (Frage läuft) ist der Leaderboard-Toggle ohne Wirkung —
// das Leaderboard erscheint nur zwischen Fragen.
function BeamerView({
  state,
  showLeaderboard,
  classId,
}: {
  state: Extract<QuizBeamerState, { kind: 'active' | 'between' }>;
  showLeaderboard: boolean;
  classId: string;
}) {
  if (state.kind === 'active') {
    return <QuizQuestionBeamer state={state.question} />;
  }
  if (showLeaderboard) {
    return <QuizLeaderboardBeamer classId={classId} initial={{ kind: 'none' }} />;
  }
  return <QuizRevealBeamer state={state.question} />;
}
