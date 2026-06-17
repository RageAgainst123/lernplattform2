'use client';

import { useEffect, useRef } from 'react';
import { cellKey } from '@/lib/blocks/crossword-grid';
import { cn } from '@/lib/utils';
import type { ActiveCell } from '@/components/blocks/use-crossword';

// Das Zellen-Gitter fürs Kreuzworträtsel (ausgelagert, hält CrosswordBlock
// unter der Zeilen-Grenze). Wie im gedruckten Rätsel: NUR die füllbaren
// Zellen sind sichtbar (weiß mit Rahmen), Zellen ohne Wort bleiben leer/
// transparent. Das aktive Wort ist blau hinterlegt, die aktive Zelle hat
// einen Ring. Nach „Prüfen": grün/rot pro Zelle, leere Zellen bleiben weiß.

type Props = {
  rows: number;
  cols: number;
  cells: Map<string, string>; // Lösungs-Zellen ("r,c" → Buchstabe)
  startNumbers: Map<string, number>; // Startzellen-Nummern
  answer: Record<string, string>;
  active: ActiveCell;
  wordKeys: Set<string>; // Zellen des aktiven Wortes (Highlight)
  checked: boolean;
  locked: boolean;
  onTap: (r: number, c: number) => void;
  onInput: (r: number, c: number, letter: string) => void;
  onBackspace: (r: number, c: number) => void;
};

// Farbklasse je Zellen-Zustand (ausgelagert wegen Komplexitäts-Limit).
function cellClass(
  checked: boolean,
  given: string,
  solution: string,
  isActive: boolean,
  inWord: boolean
): string {
  if (checked) {
    if (given === '') return 'border-foreground/25 bg-background';
    return given.toUpperCase() === solution
      ? 'border-green-600 bg-green-100 text-green-900'
      : 'border-red-500 bg-red-100 text-red-800';
  }
  if (isActive) return 'border-primary bg-primary/15 ring-primary/50 z-10 ring-2';
  if (inWord) return 'border-primary/60 bg-primary/5';
  return 'border-foreground/25 bg-background';
}

type FilledCellProps = {
  r: number;
  c: number;
  number: number | undefined;
  given: string;
  solution: string;
  isActive: boolean;
  inWord: boolean;
  p: Props;
  registerInput: (key: string, el: HTMLInputElement | null) => void;
};

// Eine füllbare Zelle: optional Startzellen-Nummer + 1-Buchstaben-Input.
function FilledCell({
  r,
  c,
  number,
  given,
  solution,
  isActive,
  inWord,
  p,
  registerInput,
}: FilledCellProps) {
  const key = cellKey(r, c);
  return (
    <div className="relative aspect-square">
      {number !== undefined && (
        <span className="text-muted-foreground pointer-events-none absolute top-px left-1 z-20 text-[0.6rem] leading-none font-medium">
          {number}
        </span>
      )}
      <input
        ref={(el) => registerInput(key, el)}
        type="text"
        inputMode="text"
        autoComplete="off"
        maxLength={1}
        value={given}
        disabled={p.locked}
        aria-label={`Zelle ${r + 1},${c + 1}`}
        // Bewusst NUR onClick (kein onFocus): der programmatische focus() nach
        // Auto-Advance würde sonst auf Kreuzungszellen die Richtung togglen.
        onClick={() => p.onTap(r, c)}
        onChange={(e) => {
          const letter = e.target.value.slice(-1);
          if (/[a-zA-ZäöüÄÖÜ]/.test(letter)) p.onInput(r, c, letter);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault();
            p.onBackspace(r, c);
          }
        }}
        className={cn(
          'size-full rounded-sm border-2 text-center text-lg font-bold uppercase caret-transparent shadow-sm transition-colors focus:outline-none disabled:opacity-100',
          cellClass(p.checked, given, solution, isActive, inWord)
        )}
      />
    </div>
  );
}

export function CrosswordGrid(p: Props) {
  const inputs = useRef(new Map<string, HTMLInputElement>());

  // Aktive Zelle fokussieren (nach Tap/Advance/Backspace).
  useEffect(() => {
    if (p.active) inputs.current.get(cellKey(p.active.r, p.active.c))?.focus();
  }, [p.active]);

  function registerInput(key: string, el: HTMLInputElement | null) {
    if (el) inputs.current.set(key, el);
    else inputs.current.delete(key);
  }

  return (
    <div
      className="grid w-fit max-w-full gap-1 overflow-x-auto py-1"
      style={{ gridTemplateColumns: `repeat(${p.cols}, 2.5rem)` }}
    >
      {Array.from({ length: p.rows * p.cols }, (_, i) => {
        const r = Math.floor(i / p.cols);
        const c = i % p.cols;
        const key = cellKey(r, c);
        const solution = p.cells.get(key);
        if (solution === undefined) {
          // Keine Wort-Zelle → unsichtbar (wie das Papier rund ums Rätsel).
          return <div key={key} aria-hidden className="aspect-square" />;
        }
        return (
          <FilledCell
            key={key}
            r={r}
            c={c}
            number={p.startNumbers.get(key)}
            given={p.answer[key] ?? ''}
            solution={solution}
            isActive={p.active?.r === r && p.active?.c === c}
            inWord={p.wordKeys.has(key)}
            p={p}
            registerInput={registerInput}
          />
        );
      })}
    </div>
  );
}
