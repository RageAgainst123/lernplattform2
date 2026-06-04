'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { endQuizSession } from '@/lib/db/quiz-session-actions';
import type { LeaderboardEntry } from '@/lib/db/quiz-leaderboard';
import type { TeacherLeaderboardState } from '@/app/api/quiz/leaderboard/route';

// Beamer-Endbildschirm nach Quiz-Ende (Phase S4, Spec §5.7).
// Zeigt 🥇🥈🥉-Podest mit den drei besten Teilnehmer:innen plus
// „Quiz beendet"-Hinweis und einen „Zurück zur Klasse"-Button.
//
// Polling läuft weiter (3s-Tick gegen /api/quiz/leaderboard), damit
// während der 5-Min-Recently-Ended-Phase nachträglich eingehende
// Antworten (theoretisch nicht möglich nach ended, aber als Safety) das
// Podest aktualisieren. Bei kind!=='ok' nach 30 Sek harter Redirect.

const POLL_INTERVAL_MS = 3000;
const AUTO_REDIRECT_AFTER_MS = 5 * 60 * 1000;

type Props = {
  classId: string;
};

export function QuizPodestBeamer({ classId }: Props) {
  const router = useRouter();
  const state = useFinalLeaderboardPoll(classId);

  // Auto-Redirect nach 5 Min (= recently-ended Fenster). Danach würde
  // /api/quiz/leaderboard ohnehin kind='none' liefern.
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/lehrer/klassen/${classId}`);
    }, AUTO_REDIRECT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [classId, router]);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="text-6xl">🎉</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Quiz beendet!</h1>
      </div>
      <Podest entries={state.kind === 'ok' ? state.top : []} />
      <DoneActions classId={classId} />
    </div>
  );
}

function Podest({ entries }: { entries: LeaderboardEntry[] }) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];
  if (!first) {
    return <p className="text-2xl text-slate-500">Keine Teilnehmer:innen mit Punkten.</p>;
  }
  // Höhen der Säulen visuell: 1. > 2. > 3.
  return (
    <div className="flex items-end justify-center gap-4">
      {second && <PodestStep entry={second} medal="🥈" height="h-40" bg="bg-slate-300" />}
      <PodestStep entry={first} medal="🥇" height="h-56" bg="bg-amber-400" />
      {third && <PodestStep entry={third} medal="🥉" height="h-32" bg="bg-orange-300" />}
    </div>
  );
}

function PodestStep({
  entry,
  medal,
  height,
  bg,
}: {
  entry: LeaderboardEntry;
  medal: string;
  height: string;
  bg: string;
}) {
  return (
    <div className="flex w-48 flex-col items-center">
      <p className="text-5xl">{medal}</p>
      <p className="mt-2 text-2xl font-semibold">{entry.displayName}</p>
      <p className="text-lg font-bold text-slate-700 tabular-nums">
        {entry.totalPoints.toLocaleString('de-AT')} Punkte
      </p>
      <div className={`mt-3 w-full rounded-t-xl ${bg} ${height} shadow-md`} />
    </div>
  );
}

function DoneActions({ classId }: { classId: string }) {
  const router = useRouter();
  const handleBack = () => {
    // Defensiver Server-Action-Aufruf: falls Heartbeat-Tod nicht griff,
    // markieren wir die Session sicher als ended bevor wir zurücknavigieren.
    void endQuizSession(classId).finally(() => {
      router.push(`/lehrer/klassen/${classId}`);
    });
  };
  return (
    <Button onClick={handleBack} className="h-12 px-8 text-lg">
      Zurück zur Klasse
    </Button>
  );
}

// Polling für das Final-Leaderboard. 3s reicht, da nach 'ended' keine neuen
// Antworten mehr kommen (Backfill ist abgeschlossen). Kein Tab-pause-Handling
// nötig — der Polling-Hook läuft maximal 5 Min wegen Auto-Redirect.
function useFinalLeaderboardPoll(classId: string): TeacherLeaderboardState {
  const [state, setState] = useState<TeacherLeaderboardState>({ kind: 'none' });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
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
        // Netz-/Abbruchfehler ignorieren — nächster Tick versucht erneut.
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [classId]);

  return state;
}
