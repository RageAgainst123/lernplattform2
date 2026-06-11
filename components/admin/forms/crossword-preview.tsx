'use client';

import type { CrosswordBlock } from '@/lib/schemas/blocks';
import {
  buildCrosswordGrid,
  cellKey,
  crosswordNumbering,
  type CrosswordIssue,
} from '@/lib/blocks/crossword-grid';
import { cn } from '@/lib/utils';

// Live-Vorschau im Kreuzworträtsel-Editor: zeigt das abgeleitete Gitter mit
// Lösungs-Buchstaben + Startzellen-Nummern und markiert Probleme sofort
// (Kreuzungs-Konflikt rot, Wort ragt aus dem Gitter). Nutzt dieselbe
// Ableitung wie Grading + Schüler-Renderer (lib/blocks/crossword-grid.ts).

function issueText(issue: CrosswordIssue, words: CrosswordBlock['words']): string {
  const wordOf = (id: string) => words.find((w) => w.id === id)?.answer ?? id;
  if (issue.type === 'outOfGrid') {
    return `„${wordOf(issue.wordId)}" ragt aus dem Gitter — Startzelle/Richtung anpassen oder Gitter vergrößern.`;
  }
  return `Kreuzungs-Konflikt bei Zeile ${issue.r + 1}, Spalte ${issue.c + 1}: „${issue.existing}" ≠ „${issue.incoming}" („${wordOf(issue.wordId)}").`;
}

export function CrosswordPreview({
  rows,
  cols,
  words,
}: {
  rows: number;
  cols: number;
  words: CrosswordBlock['words'];
}) {
  const { cells, issues } = buildCrosswordGrid(rows, cols, words);
  const { startNumbers } = crosswordNumbering(words);
  const conflictKeys = new Set(
    issues.filter((i) => i.type === 'conflict').map((i) => cellKey(i.r, i.c))
  );

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium">Vorschau (mit Lösung)</span>
      <div
        className="bg-border grid w-fit gap-px rounded border p-px"
        style={{ gridTemplateColumns: `repeat(${cols}, 1.75rem)` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const key = cellKey(Math.floor(i / cols), i % cols);
          const letter = cells.get(key);
          if (letter === undefined) {
            return <div key={key} className="bg-muted/60 aspect-square" />;
          }
          return (
            <div
              key={key}
              className={cn(
                'relative flex aspect-square items-center justify-center text-xs font-semibold',
                conflictKeys.has(key) ? 'bg-red-100 text-red-700' : 'bg-background'
              )}
            >
              {startNumbers.has(key) && (
                <span className="text-muted-foreground absolute top-0 left-0.5 text-[0.5rem] leading-none">
                  {startNumbers.get(key)}
                </span>
              )}
              {letter}
            </div>
          );
        })}
      </div>
      {issues.length > 0 && (
        <ul className="text-destructive space-y-1 text-xs">
          {issues.map((issue, i) => (
            <li key={i}>⚠ {issueText(issue, words)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
