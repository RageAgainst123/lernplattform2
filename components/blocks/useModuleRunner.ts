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

// Phase W (2026-06): Wie oft darf Schüler:in einen Block prüfen? ALLE
// auto-bewertbaren Typen tragen das optionale Feld (gradedBlockExtensions) —
// generisch lesen statt Typ-Liste pflegen (die Liste hatte crossword/memory/
// label_image & Co. ausgesperrt). Default 1 Versuch.
function getMaxAttempts(block: Block | undefined): number {
  if (!block || !isGraded(block)) return 1;
  return 'maxAttempts' in block ? (block.maxAttempts ?? 1) : 1;
}

// Wann zählen wir Punkte/Streak? Beim 1. Versuch wenn richtig, oder beim
// letzten erlaubten Versuch (auch wenn falsch). Mehrfachversuch-Penalty
// fließt in Phase X in die Live-Quiz-Punkte ein; Solo bleibt binär.
function shouldRecordPoints(
  graded: boolean,
  correct: boolean,
  attemptCount: number,
  nextAttempt: number,
  maxAttempts: number
): boolean {
  const isFinalAttempt = correct || nextAttempt >= maxAttempts;
  return graded && isFinalAttempt && attemptCount === 0;
}

// Berechnet das abgeleitete View-Modell aus dem rohen Hook-State.
// Pure Helper — kein useState, damit useModuleRunner schlank bleibt.
function deriveRunnerView(args: {
  blocks: Block[];
  index: number;
  answers: Record<string, BlockAnswer>;
  checked: boolean;
  attemptByBlock: Record<string, number>;
}) {
  const { blocks, index, answers, checked, attemptByBlock } = args;
  const block = blocks[index];
  const graded = isGraded(block);
  const correct = graded ? evaluateBlock(block, answers[block.id]) : true;
  const maxAttempts = getMaxAttempts(block);
  const attemptCount = block ? (attemptByBlock[block.id] ?? 0) : 0;
  const canRetry = checked && !correct && attemptCount < maxAttempts;
  return { block, graded, correct, maxAttempts, attemptCount, canRetry };
}

// Action-Bündel (setAnswer/check/retry/next). Ausgelagert damit der Hook
// die 50-Zeilen-Marke nicht reißt.
function buildActions(args: {
  block: Block | undefined;
  graded: boolean;
  correct: boolean;
  attemptCount: number;
  maxAttempts: number;
  blocksLength: number;
  setIndex: (fn: (i: number) => number) => void;
  setAnswers: (fn: (prev: Record<string, BlockAnswer>) => Record<string, BlockAnswer>) => void;
  setChecked: (v: boolean) => void;
  setAttemptByBlock: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  recordPoints: (correct: boolean) => void;
}) {
  const {
    block,
    graded,
    correct,
    attemptCount,
    maxAttempts,
    blocksLength,
    setIndex,
    setAnswers,
    setChecked,
    setAttemptByBlock,
    recordPoints,
  } = args;
  return {
    setAnswer(answer: BlockAnswer) {
      if (!block) return;
      setAnswers((prev) => ({ ...prev, [block.id]: answer }));
    },
    check() {
      if (!block) return;
      setChecked(true);
      const nextAttempt = attemptCount + 1;
      setAttemptByBlock((prev) => ({ ...prev, [block.id]: nextAttempt }));
      if (shouldRecordPoints(graded, correct, attemptCount, nextAttempt, maxAttempts)) {
        recordPoints(correct);
      }
    },
    retry() {
      setChecked(false);
    },
    next() {
      setChecked(false);
      setIndex((i) => Math.min(i + 1, blocksLength - 1));
    },
  };
}

// View-Slice für das Render-Modell (Navigation + Antwort + Versuche).
type ViewSlice = ReturnType<typeof deriveRunnerView>;
function buildRunnerView(args: {
  view: ViewSlice;
  index: number;
  total: number;
  answers: Record<string, BlockAnswer>;
  checked: boolean;
  streak: number;
}) {
  const { view, index, total, answers, checked, streak } = args;
  return {
    block: view.block,
    index,
    total,
    isLast: index >= total - 1,
    answers,
    checked,
    correct: view.correct,
    needsCheck: view.graded && !checked,
    canRetry: view.canRetry,
    attemptCount: view.attemptCount,
    maxAttempts: view.maxAttempts,
    streak,
  };
}

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
  // Phase W: pro Block-ID die Anzahl bisheriger Prüfungen.
  const [attemptByBlock, setAttemptByBlock] = useState<Record<string, number>>({});
  const points = useRunnerPoints(index, timeLimitSeconds);

  const view = deriveRunnerView({ blocks, index, answers, checked, attemptByBlock });
  const { block, graded, correct, maxAttempts, attemptCount } = view;

  const actions = buildActions({
    block,
    graded,
    correct,
    attemptCount,
    maxAttempts,
    blocksLength: blocks.length,
    setIndex,
    setAnswers,
    setChecked,
    setAttemptByBlock,
    recordPoints: (correctAnswer: boolean) => block && points.recordCheck(block.id, correctAnswer),
  });

  return {
    ...buildRunnerView({
      view,
      index,
      total: blocks.length,
      answers,
      checked,
      streak: points.streak,
    }),
    ...actions,
    score: () => scoreModule(blocks, answers),
    maxScore: () => maxScore(blocks),
    pointsByBlock: points.pointsByBlock,
    totalPoints: points.totalPoints,
    longestStreak: points.longestStreak,
  };
}
