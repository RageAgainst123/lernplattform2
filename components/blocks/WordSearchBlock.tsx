'use client';

import type { WordSearchBlock as WordSearchBlockType } from '@/lib/schemas/blocks';
import { cellKey } from '@/lib/blocks/word-search-grid';
import { useWordSearch } from '@/components/blocks/use-word-search';
import { cn } from '@/lib/utils';

// Wortsuchrätsel: Wörter im Buchstabengitter finden. Erster Tap = Anker,
// zweiter Tap = Wort-Ende; liegt auf der Linie ein gesuchtes Wort, bleibt es
// grün markiert. Unter dem Gitter die Wortliste (durchgestrichen = gefunden).
//
// answer: string[] der gefundenen wordIds. checked/readOnly = gesperrt; im
// checked-Zustand werden NICHT gefundene Wörter amber aufgedeckt. Teilpunkte =
// gefundene / alle Wörter (lib/blocks/evaluate.ts).

type Props = {
  block: WordSearchBlockType;
  answer: string[]; // gefundene wordIds
  checked: boolean;
  readOnly?: boolean;
  onAnswer: (next: string[]) => void;
};

function cellClass(opts: { found: boolean; missed: boolean; anchored: boolean; locked: boolean }) {
  return cn(
    'flex aspect-square select-none items-center justify-center rounded border font-mono text-xs font-semibold uppercase sm:text-sm',
    opts.found
      ? 'border-green-500 bg-green-100 text-green-900'
      : opts.missed
        ? 'border-amber-400 bg-amber-50 text-amber-900'
        : 'border-input bg-background',
    opts.anchored && 'ring-primary ring-2',
    !opts.locked && 'hover:bg-muted cursor-pointer'
  );
}

// Im checked-Zustand: Zellen der NICHT gefundenen Wörter (amber aufdecken).
function collectMissedCells(
  block: WordSearchBlockType,
  found: string[],
  cellsByWord: Map<string, string[]>,
  checked: boolean
): Set<string> {
  const set = new Set<string>();
  if (!checked) return set;
  for (const w of block.words) {
    if (found.includes(w.id)) continue;
    for (const key of cellsByWord.get(w.id) ?? []) set.add(key);
  }
  return set;
}

type GridProps = {
  block: WordSearchBlockType;
  locked: boolean;
  anchor: { r: number; c: number } | null;
  letterAt: (r: number, c: number) => string;
  foundCells: Set<string>;
  missedCells: Set<string>;
  onTap: (r: number, c: number) => void;
};

function LetterGrid({
  block,
  locked,
  anchor,
  letterAt,
  foundCells,
  missedCells,
  onTap,
}: GridProps) {
  return (
    <div
      className="grid max-w-md gap-0.5"
      style={{ gridTemplateColumns: `repeat(${block.cols}, minmax(0, 1fr))` }}
      role="group"
      aria-label="Buchstabengitter"
    >
      {Array.from({ length: block.rows * block.cols }, (_, i) => {
        const r = Math.floor(i / block.cols);
        const c = i % block.cols;
        const key = cellKey(r, c);
        return (
          <button
            key={key}
            type="button"
            disabled={locked}
            onClick={() => onTap(r, c)}
            className={cellClass({
              found: foundCells.has(key),
              missed: missedCells.has(key),
              anchored: anchor?.r === r && anchor?.c === c,
              locked,
            })}
          >
            {letterAt(r, c)}
          </button>
        );
      })}
    </div>
  );
}

function WordChips({ words, found }: { words: WordSearchBlockType['words']; found: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {words.map((w) => (
        <li
          key={w.id}
          className={cn(
            'rounded-full border px-2 py-0.5 text-xs',
            found.includes(w.id)
              ? 'border-green-500 bg-green-50 text-green-900 line-through'
              : 'text-muted-foreground'
          )}
        >
          {w.word}
        </li>
      ))}
    </ul>
  );
}

export function WordSearchBlock({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const locked = checked || readOnly;
  const { anchor, letterAt, foundCells, cellsByWord, tap } = useWordSearch({
    block,
    found: answer,
    locked,
    onFound: (wordId) => onAnswer([...answer, wordId]),
  });
  const missedCells = collectMissedCells(block, answer, cellsByWord, checked);

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      <LetterGrid
        block={block}
        locked={locked}
        anchor={anchor}
        letterAt={letterAt}
        foundCells={foundCells}
        missedCells={missedCells}
        onTap={tap}
      />
      <WordChips words={block.words} found={answer} />
      <p className="text-muted-foreground text-sm">
        {answer.length} von {block.words.length} Wörtern gefunden
        {!locked && anchor && ' — tippe jetzt das Wort-Ende an'}
      </p>
    </div>
  );
}
