'use client';

import { useEffect, useRef, useState } from 'react';
import type { QuizLobbyState } from '@/app/api/quiz/lobby/route';

// Pollt /api/quiz/lobby und liefert den aktuellen Lobby-Zustand für
// Schüler:innen-Banner (auf /s) ODER Lehrer:innen-Teilnehmer-Liste (auf
// /lehrer/.../run).
//
// Polling-Strategie identisch zu useLiveSync:
//   • Tab versteckt → pausieren
//   • aktive Quiz-Session → 1.5 s (Lobby ändert sich oft: Beitritt, Start)
//   • keine Session → 5 s (spart Last)
//   • Visibility-Change → sofortiger Fetch
//
// Caller-Pattern:
//   Schüler:in: useQuizLobbyPoll(initialState)
//   Lehrer:in:  useQuizLobbyPoll(initialState, { classId })

const ACTIVE_MS = 1500;
const IDLE_MS = 5000;

type Options = { classId?: string };

export function useQuizLobbyPoll(initial: QuizLobbyState, opts: Options = {}): QuizLobbyState {
  const [state, setState] = useState<QuizLobbyState>(initial);
  // Letzter "aktiv"-Zustand → Scheduler-Intervall ohne Effect-Restart.
  const activeRef = useRef(hasActiveSession(initial));

  useEffect(() => {
    const url = opts.classId
      ? `/api/quiz/lobby?classId=${encodeURIComponent(opts.classId)}`
      : '/api/quiz/lobby';
    const stopper = { cancelled: false, timer: null as ReturnType<typeof setTimeout> | null };
    const poll = makePoller(url, stopper, activeRef, setState);
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
  }, [opts.classId]);

  return state;
}

type Stopper = { cancelled: boolean; timer: ReturnType<typeof setTimeout> | null };

function makePoller(
  url: string,
  stopper: Stopper,
  activeRef: React.MutableRefObject<boolean>,
  setState: (s: QuizLobbyState) => void
): () => Promise<void> {
  async function poll(): Promise<void> {
    if (!document.hidden) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const next = (await res.json()) as QuizLobbyState;
          if (!stopper.cancelled) {
            activeRef.current = hasActiveSession(next);
            setState(next);
          }
        }
      } catch {
        // Netz-/Abbruchfehler ignorieren — nächster Tick versucht es erneut.
      }
    }
    if (!stopper.cancelled) {
      stopper.timer = setTimeout(poll, activeRef.current ? ACTIVE_MS : IDLE_MS);
    }
  }
  return poll;
}

// Pure Helper: hat dieser State eine aktive Session? Bestimmt das
// Polling-Intervall (schneller polling wenn was los ist).
function hasActiveSession(state: QuizLobbyState): boolean {
  if (state.kind === 'student') return state.banner !== null;
  if (state.kind === 'teacher') return state.session !== null;
  return false;
}
