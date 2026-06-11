'use client';

import type { CrosswordBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { CrosswordWordRow } from './crossword-word-row';
import { CrosswordPreview } from './crossword-preview';
import { AddButton, FieldLabel, TextInput, makeOptionId } from './form-helpers';

// Form-Editor fürs Kreuzworträtsel: Gitter-Größe + Wort-Liste (Antwort, Frage,
// Richtung, Startzelle) + Live-Vorschau mit Konflikt-Warnung. Listen-getrieben,
// kein Paint-Grid — die füllbaren Zellen werden aus den Wörtern abgeleitet.

type Props = {
  value: CrosswordBlock;
  onChange: (next: CrosswordBlock) => void;
};

type Word = CrosswordBlock['words'][number];

function GridSizeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs">
      {label}
      <input
        type="number"
        min={2}
        max={15}
        value={value}
        onChange={(e) => onChange(Math.min(15, Math.max(2, Number(e.target.value))))}
        className="border-input bg-background h-9 w-16 rounded-md border px-2 text-sm"
      />
    </label>
  );
}

export function CrosswordForm({ value, onChange }: Props) {
  const set = <K extends keyof CrosswordBlock>(key: K, v: CrosswordBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updateWord(i: number, patch: Partial<Word>) {
    set(
      'words',
      value.words.map((w, idx) => (idx === i ? { ...w, ...patch } : w))
    );
  }
  function addWord() {
    if (value.words.length >= 10) return;
    set('words', [
      ...value.words,
      {
        id: makeOptionId(value.words, 'w'),
        answer: '',
        clue: '',
        direction: 'across',
        row: 0,
        col: 0,
      },
    ]);
  }
  function removeWord(i: number) {
    if (value.words.length <= 2) return;
    set(
      'words',
      value.words.filter((_, idx) => idx !== i)
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-instr`}>Aufgabenstellung</FieldLabel>
        <TextInput
          id={`${value.id}-instr`}
          value={value.instruction}
          onChange={(v) => set('instruction', v)}
          placeholder={'z.B. „Fülle das Kreuzworträtsel aus."'}
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-medium">Gitter</span>
        <GridSizeInput label="Zeilen" value={value.rows} onChange={(v) => set('rows', v)} />
        <GridSizeInput label="Spalten" value={value.cols} onChange={(v) => set('cols', v)} />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Wörter (2–10)</div>
        <ul className="space-y-2">
          {value.words.map((word, i) => (
            <CrosswordWordRow
              key={word.id}
              word={word}
              index={i}
              rows={value.rows}
              cols={value.cols}
              canRemove={value.words.length > 2}
              onChange={(patch) => updateWord(i, patch)}
              onRemove={() => removeWord(i)}
            />
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addWord}>Wort hinzufügen</AddButton>
        </div>
      </div>

      <CrosswordPreview rows={value.rows} cols={value.cols} words={value.words} />

      <GradedExtensionsFields
        blockId={value.id}
        hint={value.hint}
        maxAttempts={value.maxAttempts}
        category={value.category}
        onChange={(patch) => onChange({ ...value, ...patch })}
      />
    </div>
  );
}
