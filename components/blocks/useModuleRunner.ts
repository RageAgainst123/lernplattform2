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

type Args = {
  blocks: Block[];
  startIndex: number;
  initialAnswers: Record<string, BlockAnswer>;
};

// Hält Navigations- und Antwort-State für den Modul-Durchlauf.
export function useModuleRunner({ blocks, startIndex, initialAnswers }: Args) {
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<Record<string, BlockAnswer>>(initialAnswers);
  const [checked, setChecked] = useState(false);

  const block = blocks[index];
  const isLast = index >= blocks.length - 1;
  const graded = isGraded(block);
  const correct = graded ? evaluateBlock(block, answers[block.id]) : true;

  function setAnswer(answer: BlockAnswer) {
    setAnswers((prev) => ({ ...prev, [block.id]: answer }));
  }

  // Bewertbare Blöcke müssen erst „geprüft" werden, dann „Weiter".
  const needsCheck = graded && !checked;

  function next() {
    setChecked(false);
    setIndex((i) => Math.min(i + 1, blocks.length - 1));
  }

  return {
    block,
    index,
    total: blocks.length,
    isLast,
    answers,
    checked,
    correct,
    needsCheck,
    setAnswer,
    check: () => setChecked(true),
    next,
    score: () => scoreModule(blocks, answers),
    maxScore: () => maxScore(blocks),
  };
}
