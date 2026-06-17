'use client';

import type { HangmanBlock as HangmanBlockType } from '@/lib/schemas/blocks';
import { useHangman, wrongGuesses } from '@/components/blocks/use-hangman';
import { cn } from '@/lib/utils';

// Galgenmännchen: Wort Buchstabe für Buchstabe erraten, begrenzte
// Fehlversuche (Herzen statt Galgen — kindgerechter). Wörter werden
// nacheinander gespielt; answer = wordIds der gelösten Wörter. Verlorene
// Wörter werden amber aufgedeckt, dann startet das nächste. Teilpunkte =
// gelöste / alle Wörter (lib/blocks/evaluate.ts, foundRatio).

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'];

type Props = {
  block: HangmanBlockType;
  answer: string[]; // gelöste wordIds
  checked: boolean;
  readOnly?: boolean;
  onAnswer: (next: string[]) => void;
};

type Word = HangmanBlockType['words'][number];

function Keyboard({
  word,
  guessed,
  onGuess,
}: {
  word: Word;
  guessed: string[];
  onGuess: (letter: string) => void;
}) {
  return (
    <div className="flex max-w-md flex-wrap gap-1">
      {ALPHABET.map((letter) => {
        const used = guessed.includes(letter);
        const hit = used && word.word.includes(letter);
        return (
          <button
            key={letter}
            type="button"
            disabled={used}
            onClick={() => onGuess(letter)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded border font-mono text-xs font-semibold',
              used
                ? hit
                  ? 'border-green-500 bg-green-100 text-green-900'
                  : 'border-input bg-muted text-muted-foreground line-through opacity-50'
                : 'border-input bg-background hover:bg-muted cursor-pointer'
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

function WordSummary({
  words,
  solved,
  failed,
}: {
  words: Word[];
  solved: string[];
  failed: string[];
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {words.map((w) => {
        const ok = solved.includes(w.id);
        const lost = failed.includes(w.id);
        return (
          <li
            key={w.id}
            className={cn(
              'rounded-full border px-2 py-0.5 font-mono text-xs',
              ok
                ? 'border-green-500 bg-green-50 text-green-900'
                : lost
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'text-muted-foreground'
            )}
          >
            {ok || lost ? w.word : '?'.repeat(w.word.length)}
          </li>
        );
      })}
    </ul>
  );
}

export function HangmanBlock({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const locked = checked || readOnly;
  const { active, guessed, failed, guess } = useHangman({
    block,
    solved: answer,
    locked,
    onSolved: (id) => onAnswer([...answer, id]),
  });
  const livesLeft = active ? block.maxWrong - wrongGuesses(active, guessed) : 0;
  // Im checked-Zustand alle nicht gelösten Wörter aufdecken.
  const revealed = checked
    ? block.words.map((w) => w.id).filter((id) => !answer.includes(id))
    : failed;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      {active && !locked ? (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-muted-foreground text-sm">💡 {active.hint}</p>
          <p className="font-mono text-2xl font-semibold tracking-[0.3em]">
            {[...active.word].map((l) => (guessed.includes(l) ? l : '_')).join('')}
          </p>
          <p className="text-sm" aria-label={`${livesLeft} Versuche übrig`}>
            {'❤️'.repeat(livesLeft)}
            {'🖤'.repeat(block.maxWrong - livesLeft)}
          </p>
          <Keyboard word={active} guessed={guessed} onGuess={guess} />
        </div>
      ) : (
        <WordSummary words={block.words} solved={answer} failed={revealed} />
      )}
      <p className="text-muted-foreground text-sm">
        {answer.length} von {block.words.length} Wörtern erraten
      </p>
    </div>
  );
}
