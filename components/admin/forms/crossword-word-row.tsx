'use client';

import type { CrosswordBlock } from '@/lib/schemas/blocks';
import { ItemAction, TextInput } from './form-helpers';

// Eine Wort-Zeile im Kreuzworträtsel-Editor: Antwort (auto-uppercase), Frage,
// Richtung, Startzelle (Zeile/Spalte, 1-basiert angezeigt, 0-basiert
// gespeichert). Ausgelagert, hält CrosswordForm unter der Zeilen-Grenze.

type Word = CrosswordBlock['words'][number];

function CellNumberInput({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1 text-xs">
      {label}
      <input
        type="number"
        min={1}
        max={max}
        value={value + 1}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) - 1))}
        className="border-input bg-background h-9 w-14 rounded-md border px-2 text-sm"
      />
    </label>
  );
}

export function CrosswordWordRow({
  word,
  index,
  rows,
  cols,
  canRemove,
  onChange,
  onRemove,
}: {
  word: Word;
  index: number;
  rows: number;
  cols: number;
  canRemove: boolean;
  onChange: (patch: Partial<Word>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="space-y-2 rounded-md border p-2">
      <div className="flex items-center gap-2">
        <TextInput
          id={`cw-${word.id}-answer`}
          value={word.answer}
          onChange={(v) => onChange({ answer: v.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '') })}
          placeholder={`Lösungswort ${index + 1} (GROSSBUCHSTABEN)`}
        />
        <select
          value={word.direction}
          onChange={(e) => onChange({ direction: e.target.value as Word['direction'] })}
          aria-label={`Richtung für Wort ${index + 1}`}
          className="border-input bg-background h-9 shrink-0 rounded-md border px-2 text-sm"
        >
          <option value="across">→ waagrecht</option>
          <option value="down">↓ senkrecht</option>
        </select>
        <CellNumberInput
          label="Zeile"
          value={word.row}
          max={rows}
          onChange={(row) => onChange({ row })}
        />
        <CellNumberInput
          label="Spalte"
          value={word.col}
          max={cols}
          onChange={(col) => onChange({ col })}
        />
        <ItemAction onClick={onRemove} label="✕" disabled={!canRemove} tone="destructive" />
      </div>
      <TextInput
        id={`cw-${word.id}-clue`}
        value={word.clue}
        onChange={(v) => onChange({ clue: v })}
        placeholder="Frage / Hinweis"
      />
    </li>
  );
}
