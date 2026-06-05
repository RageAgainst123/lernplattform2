'use client';

import { useCallback, useState } from 'react';
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
// Channel: quiz_session:{sessionId}. Bei kind='none' (kein aktives Quiz)
// ist der Hook deaktiviert — Polling reicht zum Aufholen.

const POLL_FALLBACK_MS = 5000;
const QUIZ_EVENTS = [
  events.quiz.questionStarted,
  events.quiz.questionRevealed,
  events.quiz.nextQuestion,
  events.quiz.quizEnded,
  events.quiz.answerReceived,
] as const;

function sessionIdOf(state: QuizQuestionState): string | null {
  return state.kind === 'none' ? null : state.sessionId;
}

export function useQuizQuestionPoll(initial: QuizQuestionState): QuizQuestionState {
  const fetcher = useCallback(async (): Promise<QuizQuestionState> => {
    const res = await fetch('/api/quiz/question', { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return (await res.json()) as QuizQuestionState;
  }, []);

  // Pre-Launch-Audit MED-2 (2026-06-04): channelName aus dem AKTUELLEN State
  // berechnen, nicht aus initial. Sonst bleibt der Hook auf dem Initial-
  // Channel hängen — wenn das Quiz von 'none' → 'lobby'/'active' wechselt
  // (nach Lehrer-Start), würde Realtime ohne diesen Trick blind bleiben bis
  // zum nächsten Server-Refresh. Polling fängt es zwar, aber Latenz statt
  // <300ms wäre 5s.
  //
  // Wir tracken sessionId in lokalem State und updaten ihn wenn der fetcher
  // einen neuen liefert. Der hook below re-subscribed automatisch wenn sich
  // channelName ändert (siehe useEffect-deps in useRealtimeWithFallback).
  const [sessionId, setSessionId] = useState<string | null>(sessionIdOf(initial));
  const wrappedFetcher = useCallback(async (): Promise<QuizQuestionState> => {
    const next = await fetcher();
    const nextSid = sessionIdOf(next);
    if (nextSid !== sessionId) setSessionId(nextSid);
    return next;
  }, [fetcher, sessionId]);

  // Wenn keine sessionId bekannt ist, kein Channel öffnen (channelName=''),
  // aber Polling läuft weiter und holt die Session-id sobald sie da ist —
  // dann re-subscribed der Hook automatisch (channelName als useEffect-dep).
  const { state } = useRealtimeWithFallback<QuizQuestionState>({
    channelName: sessionId ? channels.quizSession(sessionId) : '',
    events: QUIZ_EVENTS,
    fetcher: wrappedFetcher,
    initial,
    pollIntervalMs: POLL_FALLBACK_MS,
  });
  return state;
}
