'use client';

import { useQuizLobbyPoll } from '@/components/quiz/useQuizLobbyPoll';
import { QuizLiveBanner } from '@/components/student/QuizLiveBanner';
import type { StudentLobbyState } from '@/app/api/quiz/lobby/route';

// Polling-Wrapper für den Schüler:innen-Quiz-Banner auf /s (S1.C).
// Bekommt den initialen Snapshot server-seitig (damit kein Flicker beim
// Mount), pollt dann alle 1.5 s ob sich was ändert — neu gestartetes Quiz,
// Status-Wechsel lobby → active, eigener Beitritt von anderem Tab.

type Props = {
  initial: StudentLobbyState;
};

export function QuizLiveBannerPolling({ initial }: Props) {
  const state = useQuizLobbyPoll(initial);

  // Defensive: Lehrer:innen-State wird hier nicht erwartet (anderer Endpunkt-
  // Modus), aber Type-Guard schützt vor Surprises.
  if (state.kind !== 'student' || !state.banner) return null;

  const { banner } = state;
  return (
    <QuizLiveBanner
      sessionId={banner.sessionId}
      moduleTitle={banner.moduleTitle}
      teamMode={banner.teamMode}
      status={banner.status}
      alreadyJoined={banner.alreadyJoined}
    />
  );
}
