'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizLobbyState } from '@/app/api/quiz/lobby/route';
import { useRealtimeWithFallback } from '@/components/realtime/useRealtimeWithFallback';
import { channels, events } from '@/lib/realtime/channels';

// Pollt /api/quiz/lobby und liefert den aktuellen Lobby-Zustand für
// Schüler:innen-Banner (auf /s) ODER Lehrer:innen-Teilnehmer-Liste (auf
// /lehrer/.../run).
//
// Phase T4 (ADR-0016): Lehrer-Modus läuft jetzt über Realtime-Broadcast.
// Wenn ein:e Schüler:in der Lobby beitritt, sieht Lehrer:in es <300ms
// statt nach Polling-Tick. Schüler-Modus bleibt klassisches Polling
// (5s reicht — Schüler:in wartet eh aufs Quiz, kein Lehrer-Live-Signal
// nötig + Schüler-Banner pollt OHNE bekannte sessionId und kann deshalb
// auch nicht auf einen Channel subscriben).

const STUDENT_ACTIVE_MS = 1500;
const STUDENT_IDLE_MS = 5000;
const TEACHER_POLL_FALLBACK_MS = 5000;
const LOBBY_EVENTS = [
  events.quiz.participantJoined,
  events.quiz.questionStarted,
  events.quiz.questionRevealed,
  events.quiz.nextQuestion,
  events.quiz.quizEnded,
] as const;

type Options = { classId?: string };

export function useQuizLobbyPoll(initial: QuizLobbyState, opts: Options = {}): QuizLobbyState {
  const isTeacher = opts.classId !== undefined;
  // Beide Hooks werden IMMER aufgerufen (React-Hooks-Regel: konsistente
  // Reihenfolge pro Render). Per Mode wird einer der Returns genommen.
  const teacherState = useTeacherLobbyHybrid(initial, opts.classId, isTeacher);
  const studentState = useStudentLobbyPoll(initial, !isTeacher);
  return isTeacher ? teacherState : studentState;
}

// Lehrer-Modus: Realtime + 5-s-Polling-Fallback. Channel kommt aus dem
// aktuellen State (session.id) — bei kind='none' Idle-Channel.
// enabled=false → fetcher liefert initial-Zustand, kein Polling/Realtime.
function useTeacherLobbyHybrid(
  initial: QuizLobbyState,
  classId: string | undefined,
  enabled: boolean
): QuizLobbyState {
  const fetcher = useCallback(async (): Promise<QuizLobbyState> => {
    if (!enabled || !classId) return initial;
    const url = `/api/quiz/lobby?classId=${encodeURIComponent(classId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    return (await res.json()) as QuizLobbyState;
  }, [classId, enabled, initial]);

  return useRealtimeWithFallback<QuizLobbyState>({
    channelName: enabled ? teacherChannelFor(initial) : 'quiz_session:disabled',
    events: LOBBY_EVENTS,
    fetcher,
    initial,
    pollIntervalMs: TEACHER_POLL_FALLBACK_MS,
  });
}

function teacherChannelFor(state: QuizLobbyState): string {
  if (state.kind === 'teacher' && state.session) {
    return channels.quizSession(state.session.id);
  }
  return 'quiz_session:idle';
}

// Schüler-Modus: 1.5s-aktiv-Polling, 5s-idle. enabled=false → kein
// Polling, return initial.
function useStudentLobbyPoll(initial: QuizLobbyState, enabled: boolean): QuizLobbyState {
  const [state, setState] = useState<QuizLobbyState>(initial);
  const activeRef = useRef(hasStudentBanner(initial));

  useEffect(() => {
    if (!enabled) return undefined;
    const stopper = { cancelled: false, timer: null as ReturnType<typeof setTimeout> | null };
    const poll = makeStudentPoller(stopper, activeRef, setState);
    function onVisibility() {
      if (document.hidden) return;
      if (stopper.timer) clearTimeout(stopper.timer);
      void poll();
    }
    void poll();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopper.cancelled = true;
      if (stopper.timer) clearTimeout(stopper.timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return state;
}

type Stopper = { cancelled: boolean; timer: ReturnType<typeof setTimeout> | null };

function makeStudentPoller(
  stopper: Stopper,
  activeRef: React.MutableRefObject<boolean>,
  setState: (s: QuizLobbyState) => void
): () => Promise<void> {
  async function poll(): Promise<void> {
    if (!document.hidden) {
      try {
        const res = await fetch('/api/quiz/lobby', { cache: 'no-store' });
        if (res.ok) {
          const next = (await res.json()) as QuizLobbyState;
          if (!stopper.cancelled) {
            activeRef.current = hasStudentBanner(next);
            setState(next);
          }
        }
      } catch {
        // Netz-/Abbruchfehler ignorieren — nächster Tick versucht es erneut.
      }
    }
    if (!stopper.cancelled) {
      stopper.timer = setTimeout(poll, activeRef.current ? STUDENT_ACTIVE_MS : STUDENT_IDLE_MS);
    }
  }
  return poll;
}

// Pure Helper: hat dieser Schüler-State ein sichtbares Banner? Bestimmt
// das Polling-Intervall (schneller polling wenn was los ist).
function hasStudentBanner(state: QuizLobbyState): boolean {
  return state.kind === 'student' && state.banner !== null;
}
