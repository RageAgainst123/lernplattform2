'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@/lib/db/quiz-leaderboard';
import type { TeacherLeaderboardState } from '@/app/api/quiz/leaderboard/route';

// Beamer-Anzeige des Leaderboards (Phase S3, Spec §5.6).
//
// Wird vom Lehrer:innen-Toggle in den Reveal-Bildschirm eingeblendet.
// Top-5 mit Codename + Punkten. Letzter Platz wird NICHT gezeigt
// (Schutz vor Bloßstellung) — bei Top-5 immer erfüllt, sobald >5
// Teilnehmer:innen mitspielen.
//
// Polling: 3s-Intervall (zwischen Fragen wenig Bewegung erwartet).

const POLL_INTERVAL_MS = 3000;

type Props = {
  classId: string;
  initial: TeacherLeaderboardState;
};

export function QuizLeaderboardBeamer({ classId, initial }: Props) {
  const state = useTeacherLeaderboardPoll(classId, initial);

  if (state.kind === 'none' || state.top.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center text-2xl text-slate-500">
        Noch keine Punkte
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">🏆 Leaderboard</h2>
      <ol className="space-y-3">
        {state.top.map((entry) => (
          <LeaderboardRow key={entry.studentCodeId} entry={entry} />
        ))}
      </ol>
      {state.totalParticipants > 5 && (
        <p className="text-muted-foreground mt-6 text-center text-sm">
          … von {state.totalParticipants} Teilnehmer:innen
        </p>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
  const ringClass =
    entry.rank === 1
      ? 'ring-2 ring-amber-400 bg-amber-50'
      : entry.rank === 2
        ? 'ring-2 ring-slate-300 bg-slate-50'
        : entry.rank === 3
          ? 'ring-2 ring-orange-300 bg-orange-50'
          : 'bg-white';

  return (
    <li className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm ${ringClass}`}>
      <span className="w-12 text-center text-3xl font-bold text-slate-700 tabular-nums">
        {medal ?? entry.rank}
      </span>
      <span className="flex-1 text-2xl font-semibold">{entry.displayName}</span>
      <span className="text-2xl font-bold text-slate-900 tabular-nums">
        {entry.totalPoints.toLocaleString('de-AT')}
      </span>
    </li>
  );
}

// Adaptives Polling: 3s-Tick. Wird ausgesetzt wenn Tab versteckt.
function useTeacherLeaderboardPoll(
  classId: string,
  initial: TeacherLeaderboardState
): TeacherLeaderboardState {
  const [state, setState] = useState<TeacherLeaderboardState>(initial);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      if (!document.hidden) {
        try {
          const res = await fetch(
            `/api/quiz/leaderboard?mode=teacher&classId=${encodeURIComponent(classId)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const next = (await res.json()) as TeacherLeaderboardState;
            if (!cancelled) setState(next);
          }
        } catch {
          // Netz-/Abbruchfehler ignorieren, nächster Tick versucht erneut.
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
  }, [classId]);

  return state;
}
