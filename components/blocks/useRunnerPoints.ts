'use client';

import { useEffect, useRef, useState } from 'react';
import { calculatePoints } from '@/lib/blocks/points';

// Punkte-/Streak-/Zeit-State des Modul-Runners, ausgelagert aus
// useModuleRunner (R1.3) — hält die Funktion dort klein genug für
// max-lines-per-function-Lint.
//
// Pure Browser-Logik: zeitabhängig + lokal, keine DB. Solo-Punkte sind
// Übungs-Motivation, nicht Wettbewerb (Spec §3.5).

export type BlockPoints = {
  blockId: string;
  correct: boolean;
  elapsedMs: number;
  streakAfter: number;
  points: number;
};

export function useRunnerPoints(currentBlockIndex: number, timeLimitSeconds: number) {
  const [streak, setStreak] = useState(0);
  const [pointsByBlock, setPointsByBlock] = useState<Record<string, BlockPoints>>({});

  // performance.now() ist monoton (resistent gegen Systemzeit-Sprünge).
  // useEffect statt direkter Aufruf, weil performance.now() in SSR nicht
  // existiert.
  const blockEnteredAt = useRef<number>(0);
  useEffect(() => {
    blockEnteredAt.current = typeof performance !== 'undefined' ? performance.now() : 0;
  }, [currentBlockIndex]);

  function recordCheck(blockId: string, correct: boolean): number {
    const elapsedMs =
      typeof performance !== 'undefined'
        ? Math.max(performance.now() - blockEnteredAt.current, 0)
        : 0;
    const newStreak = correct ? streak + 1 : 0;
    const points = calculatePoints(correct, elapsedMs, timeLimitSeconds, newStreak);
    setStreak(newStreak);
    setPointsByBlock((prev) => ({
      ...prev,
      [blockId]: { blockId, correct, elapsedMs, streakAfter: newStreak, points },
    }));
    return points;
  }

  const totalPoints = (): number =>
    Object.values(pointsByBlock).reduce((sum, p) => sum + p.points, 0);

  const longestStreak = (): number =>
    Object.values(pointsByBlock).reduce((max, p) => Math.max(max, p.streakAfter), 0);

  return { streak, pointsByBlock, recordCheck, totalPoints, longestStreak };
}
