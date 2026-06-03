'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizLobbyPoll } from '@/components/quiz/useQuizLobbyPoll';
import { QuizLobby } from '@/components/quiz/QuizLobby';
import type { TeacherLobbyState } from '@/app/api/quiz/lobby/route';

// Polling-Wrapper für die Beamer-Lobby (Phase S1.C).
// Pollt /api/quiz/lobby?classId=… alle 1.5 s. Sobald sich der Stand ändert
// (neuer Beitritt, Status-Wechsel auf active), rendert QuizLobby mit der
// aktualisierten Teilnehmer-Liste — ohne manuellen Refresh.
//
// Beim Session-Ende (z.B. "Quiz beenden" + Status='ended' → API returnt
// session: null) navigieren wir zurück zur Klassen-Seite.

type Props = {
  classId: string;
  moduleTitle: string;
  teamMode: boolean;
  initial: TeacherLobbyState;
};

export function QuizLobbyPolling({ classId, moduleTitle, teamMode, initial }: Props) {
  const router = useRouter();
  const state = useQuizLobbyPoll(initial, { classId });

  // Session weg → zurück zur Klasse. useEffect statt direkt im Render
  // (würde sonst während Render navigieren).
  useEffect(() => {
    if (state.kind === 'teacher' && state.session === null) {
      router.push(`/lehrer/klassen/${classId}`);
    }
  }, [state, router, classId]);

  // Defensive: kein teacher-State (z.B. session abgelaufen) → render leeres
  // Frame, useEffect übernimmt die Navigation.
  if (state.kind !== 'teacher' || !state.session) {
    return null;
  }

  return (
    <QuizLobby
      classId={classId}
      moduleTitle={moduleTitle}
      teamMode={teamMode}
      status={state.session.status}
      participants={state.session.participants}
    />
  );
}
