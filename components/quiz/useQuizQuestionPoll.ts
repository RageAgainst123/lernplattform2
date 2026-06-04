'use client';

import { useEffect, useRef, useState } from 'react';
import type { QuizQuestionState } from '@/app/api/quiz/question/route';

// Schüler:innen-Polling für die Live-Frage-Phase (Phase S2.D).
// Pollt /api/quiz/question:
//   • active (Frage läuft) → 1 s (counter + countdown)
//   • between (Reveal) → 2 s
//   • lobby → 3 s
//   • none → 5 s (kein quiz aktiv)
//   • Tab versteckt → pausieren

const ACTIVE_MS = 1000;
const BETWEEN_MS = 2000;
const LOBBY_MS = 3000;
const IDLE_MS = 5000;

function intervalFor(state: QuizQuestionState): number {
  if (state.kind === 'active') return ACTIVE_MS;
  if (state.kind === 'between') return BETWEEN_MS;
  if (state.kind === 'lobby') return LOBBY_MS;
  return IDLE_MS;
}

export function useQuizQuestionPoll(initial: QuizQuestionState): QuizQuestionState {
  const [state, setState] = useState<QuizQuestionState>(initial);
  const intervalRef = useRef(intervalFor(initial));

  useEffect(() => {
    const stopper = { cancelled: false, timer: null as ReturnType<typeof setTimeout> | null };
    const poll = makePoller(stopper, intervalRef, setState);
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
  }, []);

  return state;
}

type Stopper = { cancelled: boolean; timer: ReturnType<typeof setTimeout> | null };

function makePoller(
  stopper: Stopper,
  intervalRef: React.MutableRefObject<number>,
  setState: (s: QuizQuestionState) => void
): () => Promise<void> {
  async function poll(): Promise<void> {
    if (!document.hidden) {
      try {
        const res = await fetch('/api/quiz/question', { cache: 'no-store' });
        if (res.ok) {
          const next = (await res.json()) as QuizQuestionState;
          if (!stopper.cancelled) {
            intervalRef.current = intervalFor(next);
            setState(next);
          }
        }
      } catch {
        // Netz-/Abbruchfehler ignorieren — nächster Tick versucht es erneut.
      }
    }
    if (!stopper.cancelled) {
      stopper.timer = setTimeout(poll, intervalRef.current);
    }
  }
  return poll;
}
