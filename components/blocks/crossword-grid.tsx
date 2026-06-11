'use client';

import { useEffect, useRef } from 'react';
import { cellKey } from '@/lib/blocks/crossword-grid';
import { cn } from '@/lib/utils';
import type { ActiveCell } from '@/components/blocks/use-crossword';

// Das Zellen-Gitter fürs Kreuzworträtsel (ausgelagert, hält CrosswordBlock
// unter der Zeilen-Grenze). Füllbare Zellen sind <input maxLength=1>;
// Zellen ohne Wort sind blockiert (dunkel). Nach „Prüfen" grün/rot/neutral.

type Props = {
  rows: number;
  cols: number;
  cells: Map<string, string>; // Lösungs-Zellen ("r,c" → Buchstabe)
  startNumbers: Map<string, number>; // Startzellen-Nummern
  answer: Record<string, string>;
  active: ActiveCell;
  checked: boolean;
  locked: boolean;
  onTap: (r: number, c: number) => void;
  onInput: (r: number, c: number, letter: string) => void;
  onBackspace: (r: number, c: number) => void;
};

// Farbklasse je Zellen-Zustand (ausgelagert wegen Komplexitäts-Limit).
function cellClass(checked: boolean, given: string, solution: string, isActive: boolean): string {
  if (checked) {
    if (given === '') return 'bg-background';
    return given.toUpperCase() === solution
      ? 'border-green-600 bg-green-50 text-green-800'
      : 'border-red-600 bg-red-50 text-red-700';
  }
  return isActive ? 'border-primary bg-primary/10' : 'bg-background';
}

type FilledCellProps = {
  r: number;
  c: number;
  number: number | undefined;
  given: string;
  solution: string;
  isActive: boolean;
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
  p,
  registerInput,
}: FilledCellProps) {
  const key = cellKey(r, c);
  return (
    <div className="relative aspect-square">
      {number !== undefined && (
        <span className="text-muted-foreground pointer-events-none absolute top-0 left-0.5 text-[0.55rem] leading-none">
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
          'size-full border text-center text-base font-semibold uppercase focus:outline-none',
          cellClass(p.checked, given, solution, isActive)
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
      className="bg-border grid w-fit gap-px rounded border p-px"
      style={{ gridTemplateColumns: `repeat(${p.cols}, 2.25rem)` }}
    >
      {Array.from({ length: p.rows * p.cols }, (_, i) => {
        const r = Math.floor(i / p.cols);
        const c = i % p.cols;
        const key = cellKey(r, c);
        const solution = p.cells.get(key);
        if (solution === undefined) {
          return <div key={key} className="bg-muted/60 aspect-square" />;
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
            p={p}
            registerInput={registerInput}
          />
        );
      })}
    </div>
  );
}
