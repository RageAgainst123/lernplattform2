'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import {
  evaluateBlock,
  isGraded,
  maxScore,
  scoreModule,
  type BlockAnswer,
} from '@/lib/blocks/evaluate';
import { useRunnerPoints, type BlockPoints } from '@/components/blocks/useRunnerPoints';

export type { BlockPoints };

type Args = {
  blocks: Block[];
  startIndex: number;
  initialAnswers: Record<string, BlockAnswer>;
  // Zeitlimit für die Punkte-Formel (Default 30s, Spec §3.6).
  // Wird nur für die OPTIONALE Solo-Punkte-Anzeige genutzt — kein
  // Hard-Limit im Solo-Modus.
  timeLimitSeconds?: number;
};

// Hält Navigations- + Antwort-State für den Modul-Durchlauf. Punkte/Streak
// sind in useRunnerPoints ausgelagert (siehe dort).
export function useModuleRunner({
  blocks,
  startIndex,
  initialAnswers,
  timeLimitSeconds = 30,
}: Args) {
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<Record<string, BlockAnswer>>(initialAnswers);
  const [checked, setChecked] = useState(false);
  const points = useRunnerPoints(index, timeLimitSeconds);

  const block = blocks[index];
  const graded = isGraded(block);
  const correct = graded ? evaluateBlock(block, answers[block.id]) : true;

  function setAnswer(answer: BlockAnswer) {
    setAnswers((prev) => ({ ...prev, [block.id]: answer }));
  }

  function check() {
    setChecked(true);
    if (graded) points.recordCheck(block.id, correct);
  }

  function next() {
    setChecked(false);
    setIndex((i) => Math.min(i + 1, blocks.length - 1));
  }

  return {
    block,
    index,
    total: blocks.length,
    isLast: index >= blocks.length - 1,
    answers,
    checked,
    correct,
    needsCheck: graded && !checked,
    streak: points.streak,
    setAnswer,
    check,
    next,
    score: () => scoreModule(blocks, answers),
    maxScore: () => maxScore(blocks),
    pointsByBlock: points.pointsByBlock,
    totalPoints: points.totalPoints,
    longestStreak: points.longestStreak,
  };
}
