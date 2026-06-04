'use client';

import { useCallback } from 'react';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';
import { useRealtimeWithFallback } from '@/components/realtime/useRealtimeWithFallback';
import { channels, events } from '@/lib/realtime/channels';

// Pollt /api/quiz/beamer für die Beamer-Frage-/Reveal-Sicht (Phase S2.C +
// Phase T3).
//
// Phase T3 (ADR-0016): Hook ist jetzt ein Wrapper über useRealtimeWithFallback.
// Bei jeder Quiz-Mutation (start, reveal, next, end, answer_received,
// participant_joined) triggert der Broadcast einen Refetch — Counter
// „N/M geantwortet" und Reveal-Wechsel passieren <300ms. Polling-Tick
// 5s ist Sicherheitsnetz.
//
// Channel: quiz_session:{sessionId}. Bei kind='none' (kein aktives Quiz)
// abonnieren wir einen Idle-Channel; Polling reicht.

const POLL_FALLBACK_MS = 5000;
const BEAMER_EVENTS = [
  events.quiz.questionStarted,
  events.quiz.questionRevealed,
  events.quiz.nextQuestion,
  events.quiz.quizEnded,
  events.quiz.answerReceived,
  events.quiz.participantJoined,
] as const;

function channelFor(state: QuizBeamerState): string {
  if (state.kind === 'none') return 'quiz_session:idle';
  return channels.quizSession(state.sessionId);
}

export type UseQuizBeamerPollResult = {
  state: QuizBeamerState;
  /** Sofortiger refetch fuer schreibende Lehrer-Buttons (T3-bugfix). */
  refetch: () => Promise<void>;
};

export function useQuizBeamerPoll(
  classId: string,
  initial: QuizBeamerState
): UseQuizBeamerPollResult {
  const fetcher = useCallback(async (): Promise<QuizBeamerState> => {
    const url = `/api/quiz/beamer?classId=${encodeURIComponent(classId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return (await res.json()) as QuizBeamerState;
  }, [classId]);

  return useRealtimeWithFallback<QuizBeamerState>({
    channelName: channelFor(initial),
    events: BEAMER_EVENTS,
    fetcher,
    initial,
    pollIntervalMs: POLL_FALLBACK_MS,
  });
}
