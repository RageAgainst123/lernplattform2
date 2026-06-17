'use client';

import { useEffect, useState } from 'react';
import type { StudentLeaderboardState } from '@/app/api/quiz/leaderboard/route';

// Schüler:innen-Zwischenbildschirm zwischen Fragen (Phase S3, Spec §5.6).
// Zeigt den eigenen Rang an („🥉 Du bist auf Platz 3 von 18 mit 1017
// Punkten") sobald die erste Frage durch ist. In den ersten Sekunden
// nach dem Wechsel kann der eigene Eintrag noch fehlen → Fallback-Text.
//
// Polling: alle 3 Sekunden (Reveal-Phase, geringes Update-Aufkommen).

const POLL_INTERVAL_MS = 3000;

export function QuizBetweenWait() {
  const state = useStudentLeaderboardPoll();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl">🔍</p>
      <p className="text-xl font-semibold">Auflösung am Beamer</p>
      {state.kind === 'ok' ? <OwnRank state={state} /> : <FallbackHint />}
      <p className="text-muted-foreground text-xs">
        Schau nach vorne — gleich kommt die nächste Frage.
      </p>
    </div>
  );
}

function OwnRank({ state }: { state: Extract<StudentLeaderboardState, { kind: 'ok' }> }) {
  const medal =
    state.own.rank === 1 ? '🥇' : state.own.rank === 2 ? '🥈' : state.own.rank === 3 ? '🥉' : '🎯';
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-4">
      <p className="text-3xl font-bold text-amber-900">
        {medal} Platz {state.own.rank} von {state.totalParticipants}
      </p>
      <p className="mt-1 text-2xl font-bold text-amber-900 tabular-nums">
        {state.own.totalPoints.toLocaleString('de-AT')} Punkte
      </p>
    </div>
  );
}

function FallbackHint() {
  return <p className="text-muted-foreground text-sm">Dein Rang erscheint gleich…</p>;
}

// Polling-Hook für eigene Rang-Info. Schüler:innen-Auth via jose-Cookie,
// kein classId-Param nötig.
function useStudentLeaderboardPoll(): StudentLeaderboardState {
  const [state, setState] = useState<StudentLeaderboardState>({ kind: 'none' });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      if (!document.hidden) {
        try {
          const res = await fetch('/api/quiz/leaderboard', { cache: 'no-store' });
          if (res.ok) {
            const next = (await res.json()) as StudentLeaderboardState;
            if (!cancelled) setState(next);
          }
        } catch {
          // Netz-/Abbruchfehler ignorieren — nächster Tick versucht erneut.
        }
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    void tick();
    function onVisibility() {
      if (document.hidden) return;
      if (timer) clearTimeout(timer);
      void tick();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return state;
}
