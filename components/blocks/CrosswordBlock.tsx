'use client';

import type { CrosswordBlock as CrosswordBlockType } from '@/lib/schemas/blocks';
import { gradeCrosswordCells } from '@/lib/blocks/crossword-grid';
import { CrosswordGrid } from '@/components/blocks/crossword-grid';
import { useCrossword } from '@/components/blocks/use-crossword';

// Kreuzworträtsel: Zelle antippen, Buchstaben tippen — Auto-Advance entlang
// des Worts, Re-Tap auf Kreuzungszellen wechselt die Richtung. Unter dem
// Gitter die Fragen (waagrecht/senkrecht), Tap aktiviert die Startzelle.
//
// answer: Record<"r,c", Buchstabe>. checked → grün/rot pro Zelle + Zähler.
// Teilpunkte = richtige Zellen / füllbare Zellen (lib/blocks/crossword-grid).

type Props = {
  block: CrosswordBlockType;
  answer: Record<string, string>;
  checked: boolean;
  readOnly?: boolean;
  onAnswer: (next: Record<string, string>) => void;
};

function ClueList({
  title,
  words,
  numbers,
  onPick,
}: {
  title: string;
  words: CrosswordBlockType['words'];
  numbers: Map<string, number>;
  onPick: (w: CrosswordBlockType['words'][number]) => void;
}) {
  if (words.length === 0) return null;
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </p>
      <ul className="mt-1 space-y-1">
        {words.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onPick(w)}
              className="hover:text-primary text-left text-sm"
            >
              <span className="font-semibold">{numbers.get(w.id)}.</span> {w.clue} (
              {w.answer.length})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CrosswordBlock({ block, answer, checked, readOnly = false, onAnswer }: Props) {
  const locked = checked || readOnly;
  const cw = useCrossword({ block, answer, onAnswer });
  const across = block.words.filter((w) => w.direction === 'across');
  const down = block.words.filter((w) => w.direction === 'down');
  const correct = Math.round(gradeCrosswordCells(block, answer) * cw.cells.size);

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      <CrosswordGrid
        rows={block.rows}
        cols={block.cols}
        cells={cw.cells}
        startNumbers={cw.startNumbers}
        answer={answer}
        active={cw.active}
        wordKeys={cw.wordKeys}
        checked={checked}
        locked={locked}
        onTap={cw.tap}
        onInput={cw.input}
        onBackspace={cw.backspace}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ClueList
          title="Waagrecht →"
          words={across}
          numbers={cw.wordNumbers}
          onPick={(w) => cw.tap(w.row, w.col)}
        />
        <ClueList
          title="Senkrecht ↓"
          words={down}
          numbers={cw.wordNumbers}
          onPick={(w) => cw.tap(w.row, w.col)}
        />
      </div>
      {checked && (
        <p className="text-muted-foreground text-sm">
          {correct} von {cw.cells.size} Zellen richtig
        </p>
      )}
    </div>
  );
}
