'use client';

import { useCallback } from 'react';
import type { QuizQuestionState } from '@/app/api/quiz/question/route';
import { useRealtimeWithFallback } from '@/components/realtime/useRealtimeWithFallback';
import { channels, events } from '@/lib/realtime/channels';

// Schüler:innen-Polling für die Live-Frage-Phase (Phase S2.D + Phase T3).
//
// Phase T3 (ADR-0016): Hook ist jetzt ein Wrapper über useRealtimeWithFallback.
// Bei Mount + bei jedem relevanten Realtime-Event wird die authoritative
// /api/quiz/question-Antwort gefetcht. Der Polling-Tick (5 s default) ist
// das Sicherheitsnetz: ohne Realtime-Push würde der Hook trotzdem aktuell
// bleiben — nur langsamer.
//
// Pattern: Realtime triggert nur den Refetch, holt NICHT die Daten selbst.
// /api/quiz/question bleibt einzige Quelle der Wahrheit (mit ownAnswer-
// Berechnung server-seitig). Kein Daten-Schiefstand möglich.
//
// Channel: quiz_session:{sessionId}. Bei kind='none' (kein aktives Quiz)
// abonnieren wir einen Idle-Channel — Polling allein hält den Hook am
// Laufen und holt einen sessionId sobald ein Quiz startet.

const POLL_FALLBACK_MS = 5000;
const QUIZ_EVENTS = [
  events.quiz.questionStarted,
  events.quiz.questionRevealed,
  events.quiz.nextQuestion,
  events.quiz.quizEnded,
  events.quiz.answerReceived,
] as const;

function channelFor(state: QuizQuestionState): string {
  if (state.kind === 'none') return 'quiz_session:idle';
  return channels.quizSession(state.sessionId);
}

export function useQuizQuestionPoll(initial: QuizQuestionState): QuizQuestionState {
  const fetcher = useCallback(async (): Promise<QuizQuestionState> => {
    const res = await fetch('/api/quiz/question', { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return (await res.json()) as QuizQuestionState;
  }, []);

  const { state } = useRealtimeWithFallback<QuizQuestionState>({
    channelName: channelFor(initial),
    events: QUIZ_EVENTS,
    fetcher,
    initial,
    pollIntervalMs: POLL_FALLBACK_MS,
  });
  return state;
}
