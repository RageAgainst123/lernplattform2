'use client';

import { useState } from 'react';
import type { HangmanBlock } from '@/lib/schemas/blocks';

// Spiel-Logik fürs Galgenmännchen. Die Wörter werden NACHEINANDER gespielt:
// aktiv ist das erste Wort, das weder gelöst (answer) noch gescheitert
// (lokaler State) ist. Geratene Buchstaben + gescheiterte Wörter leben lokal
// (Spiel-Zustand wie die Memory-Flips); die dauerhafte Antwort sind nur die
// gelösten wordIds im Eltern-State.

type Word = HangmanBlock['words'][number];

export function wrongGuesses(word: Word, guessed: string[]): number {
  return guessed.filter((l) => !word.word.includes(l)).length;
}

export function isSolved(word: Word, guessed: string[]): boolean {
  return [...word.word].every((l) => guessed.includes(l));
}

export function useHangman({
  block,
  solved,
  locked,
  onSolved,
}: {
  block: HangmanBlock;
  solved: string[];
  locked: boolean;
  onSolved: (wordId: string) => void;
}) {
  const [guessedByWord, setGuessedByWord] = useState<Record<string, string[]>>({});
  const [failed, setFailed] = useState<string[]>([]);

  const active = block.words.find((w) => !solved.includes(w.id) && !failed.includes(w.id)) ?? null;
  const guessed = active ? (guessedByWord[active.id] ?? []) : [];

  function guess(letter: string) {
    if (locked || !active || guessed.includes(letter)) return;
    const next = [...guessed, letter];
    setGuessedByWord({ ...guessedByWord, [active.id]: next });
    if (isSolved(active, next)) {
      onSolved(active.id);
      return;
    }
    if (wrongGuesses(active, next) >= block.maxWrong) {
      setFailed([...failed, active.id]);
    }
  }

  return { active, guessed, failed, guess };
}
