'use client';

import type { WordSearchBlock } from '@/lib/schemas/blocks';
import {
  buildWordSearchGrid,
  cellKey,
  fillerLetter,
  type WordSearchIssue,
} from '@/lib/blocks/word-search-grid';
import { cn } from '@/lib/utils';

// Live-Vorschau im Wortsuchrätsel-Editor: Lösungs-Buchstaben hervorgehoben,
// Füllbuchstaben gedimmt (dieselben deterministischen Füllbuchstaben wie im
// Schüler-Renderer), Probleme sofort sichtbar (Konflikt rot, ragt raus).

function issueText(issue: WordSearchIssue, words: WordSearchBlock['words']): string {
  const wordOf = (id: string) => words.find((w) => w.id === id)?.word ?? id;
  if (issue.type === 'outOfGrid') {
    return `„${wordOf(issue.wordId)}" ragt aus dem Gitter — Startzelle/Richtung anpassen oder Gitter vergrößern.`;
  }
  return `Konflikt bei Zeile ${issue.r + 1}, Spalte ${issue.c + 1}: „${issue.existing}" ≠ „${issue.incoming}" („${wordOf(issue.wordId)}").`;
}

export function WordSearchPreview({
  blockId,
  rows,
  cols,
  words,
}: {
  blockId: string;
  rows: number;
  cols: number;
  words: WordSearchBlock['words'];
}) {
  const { cells, issues } = buildWordSearchGrid(rows, cols, words);
  const conflictKeys = new Set(
    issues.filter((i) => i.type === 'conflict').map((i) => cellKey(i.r, i.c))
  );

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium">Vorschau (Lösungswörter hervorgehoben)</span>
      <div
        className="bg-border grid w-fit gap-px rounded border p-px"
        style={{ gridTemplateColumns: `repeat(${cols}, 1.5rem)` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const key = cellKey(r, c);
          const letter = cells.get(key);
          return (
            <div
              key={key}
              className={cn(
                'flex aspect-square items-center justify-center text-xs font-semibold',
                conflictKeys.has(key)
                  ? 'bg-red-100 text-red-700'
                  : letter !== undefined
                    ? 'bg-primary/10 text-foreground'
                    : 'bg-background text-muted-foreground/50'
              )}
            >
              {letter ?? fillerLetter(blockId, r, c)}
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
