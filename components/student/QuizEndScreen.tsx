'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudentLeaderboardState } from '@/app/api/quiz/leaderboard/route';

// Schüler:innen-Endbildschirm nach Quiz-Ende (Phase S4, Spec §5.7).
// Zeigt eigenen Rang, Total-Punkte, correct/total. Polling holt das
// Final-Leaderboard ein einziges Mal beim Mount (DB ist nach 'ended'
// stabil — Backfill war Teil von endQuizSession).
//
// Nach 30 Sek Auto-Redirect zurück zu /s damit Schüler:in den Endscreen
// nicht für immer offen lässt. Manueller Button davor.

const AUTO_REDIRECT_AFTER_MS = 30 * 1000;

export function QuizEndScreen() {
  const router = useRouter();
  const state = useFinalRankOnce();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/s'), AUTO_REDIRECT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-6xl">🎉</p>
      <h1 className="text-3xl font-bold tracking-tight">Quiz beendet!</h1>
      {state.kind === 'ok' ? <FinalSummary state={state} /> : <LoadingHint />}
      <button
        type="button"
        onClick={() => router.push('/s')}
        className="bg-primary hover:bg-primary/90 mt-4 rounded-md px-6 py-3 text-base font-semibold text-white"
      >
        Zurück zur Übersicht
      </button>
    </div>
  );
}

function FinalSummary({ state }: { state: Extract<StudentLeaderboardState, { kind: 'ok' }> }) {
  const medal =
    state.own.rank === 1 ? '🥇' : state.own.rank === 2 ? '🥈' : state.own.rank === 3 ? '🥉' : '🎯';
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-5xl font-bold">{medal}</p>
      <p className="text-2xl font-semibold">
        Platz {state.own.rank} von {state.totalParticipants}
      </p>
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-4">
        <p className="text-xs text-amber-900 uppercase">Total</p>
        <p className="text-4xl font-bold text-amber-900 tabular-nums">
          {state.own.totalPoints.toLocaleString('de-AT')} Punkte
        </p>
        <p className="text-muted-foreground mt-2 text-sm">{state.own.correctCount} richtig</p>
      </div>
    </div>
  );
}

function LoadingHint() {
  return <p className="text-muted-foreground text-sm">Lade dein Endergebnis…</p>;
}

// Einmaliger Fetch + leichter Retry (3×, je 1s) für die ersten Sekunden
// nach Quiz-Ende. Danach Stand stabil. Spart Polling-Last gegen die
// Recently-Ended-Phase, in der ohnehin nichts mehr passiert.
function useFinalRankOnce(): StudentLeaderboardState {
  const [state, setState] = useState<StudentLeaderboardState>({ kind: 'none' });

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function fetchOnce(): Promise<void> {
      try {
        const res = await fetch('/api/quiz/leaderboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('not ok');
        const next = (await res.json()) as StudentLeaderboardState;
        if (cancelled) return;
        if (next.kind === 'ok') {
          setState(next);
          return;
        }
      } catch {
        // Network-Fehler ignorieren, retry-Schleife unten.
      }
      attempts += 1;
      if (!cancelled && attempts < 3) {
        setTimeout(() => void fetchOnce(), 1000);
      }
    }

    void fetchOnce();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
