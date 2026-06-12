'use client';

import { useState } from 'react';
import type { ScrambleBlock } from '@/lib/schemas/blocks';
import { scrambledLetters, usedTileIndices } from '@/lib/blocks/scramble';
import { cn } from '@/lib/utils';

// EIN Wort im Buchstabensalat: gemischte Buchstaben-Tiles (deterministisch
// seeded, hydration-sicher) + Aufbau-Zeile. Tile antippen = Buchstabe anhängen,
// gebauten Buchstaben antippen = zurücklegen. Der gebaute String lebt im
// Eltern-State (answer-Record); die verbrauchten Tile-Indizes werden lazy aus
// dem String rekonstruiert (überlebt Draft-Reload, korrekt bei Doppel-Buchstaben).

type Word = ScrambleBlock['words'][number];

const TILE =
  'flex h-9 w-9 select-none items-center justify-center rounded border font-mono text-sm font-semibold uppercase';

function BuiltRow({
  tiles,
  used,
  locked,
  checked,
  correct,
  onUnpick,
}: {
  tiles: string[];
  used: number[];
  locked: boolean;
  checked: boolean;
  correct: boolean;
  onUnpick: (pos: number) => void;
}) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1" aria-label="Deine Antwort">
      {used.map((tileIdx, pos) => (
        <button
          key={`${tileIdx}-${pos}`}
          type="button"
          disabled={locked}
          onClick={() => onUnpick(pos)}
          className={cn(
            TILE,
            checked
              ? correct
                ? 'border-green-500 bg-green-100 text-green-900'
                : 'border-red-400 bg-red-50 text-red-900'
              : 'border-primary bg-primary/10'
          )}
        >
          {tiles[tileIdx]}
        </button>
      ))}
      {used.length === 0 && (
        <span className="text-muted-foreground text-xs">Tippe die Buchstaben unten an…</span>
      )}
    </div>
  );
}

function PoolRow({
  tiles,
  used,
  locked,
  onPick,
}: {
  tiles: string[];
  used: number[];
  locked: boolean;
  onPick: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {tiles.map((letter, idx) => (
        <button
          key={idx}
          type="button"
          disabled={locked || used.includes(idx)}
          onClick={() => onPick(idx)}
          className={cn(
            TILE,
            'border-input bg-background',
            used.includes(idx) ? 'opacity-30' : !locked && 'hover:bg-muted cursor-pointer'
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

export function ScrambleWordField({
  blockId,
  word,
  built,
  locked,
  checked,
  onChange,
}: {
  blockId: string;
  word: Word;
  built: string;
  locked: boolean;
  checked: boolean;
  onChange: (next: string) => void;
}) {
  const tiles = scrambledLetters(word.word, `${blockId}:${word.id}`);
  const [used, setUsed] = useState<number[]>(() => usedTileIndices(tiles, built));
  const correct = built.toUpperCase() === word.word.toUpperCase();

  function applyUsed(nextUsed: number[]) {
    setUsed(nextUsed);
    onChange(nextUsed.map((i) => tiles[i]!).join(''));
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      {word.hint && <p className="text-muted-foreground text-sm">💡 {word.hint}</p>}
      <BuiltRow
        tiles={tiles}
        used={used}
        locked={locked}
        checked={checked}
        correct={correct}
        onUnpick={(pos) => applyUsed(used.filter((_, i) => i !== pos))}
      />
      <PoolRow
        tiles={tiles}
        used={used}
        locked={locked}
        onPick={(idx) => {
          if (!used.includes(idx)) applyUsed([...used, idx]);
        }}
      />
      {checked && !correct && <p className="text-sm text-amber-700">Richtig wäre: {word.word}</p>}
    </div>
  );
}
