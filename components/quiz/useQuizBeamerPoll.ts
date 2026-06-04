'use client';

import { useEffect, useRef, useState } from 'react';
import type { QuizBeamerState } from '@/app/api/quiz/beamer/route';

// Pollt /api/quiz/beamer für die Beamer-Frage-/Reveal-Sicht (Phase S2.C).
//
// Polling-Intervalle:
//   • active (Frage läuft) → 1 s — Counter "N/M geantwortet" soll
//     sich schnell aktualisieren
//   • between (Reveal-Bildschirm) → 3 s — keine Eile, Lehrer:in steuert
//   • lobby/none → 3 s — Idle
//   • Tab versteckt → pausieren

const ACTIVE_MS = 1000;
const IDLE_MS = 3000;

export function useQuizBeamerPoll(classId: string, initial: QuizBeamerState): QuizBeamerState {
  const [state, setState] = useState<QuizBeamerState>(initial);
  const activeRef = useRef(initial.kind === 'active');

  useEffect(() => {
    const url = `/api/quiz/beamer?classId=${encodeURIComponent(classId)}`;
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
  }, [classId]);

  return state;
}

type Stopper = { cancelled: boolean; timer: ReturnType<typeof setTimeout> | null };

function makePoller(
  url: string,
  stopper: Stopper,
  activeRef: React.MutableRefObject<boolean>,
  setState: (s: QuizBeamerState) => void
): () => Promise<void> {
  async function poll(): Promise<void> {
    if (!document.hidden) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const next = (await res.json()) as QuizBeamerState;
          if (!stopper.cancelled) {
            activeRef.current = next.kind === 'active';
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
