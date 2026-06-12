'use client';

import type { HangmanBlock } from '@/lib/schemas/blocks';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { AddButton, FieldLabel, ItemAction, TextInput, makeOptionId } from './form-helpers';

// Form-Editor fürs Galgenmännchen: Wort-Liste (Wort auto-uppercase +
// PFLICHT-Hinweis) und erlaubte Fehlversuche (Herzen).

type Props = {
  value: HangmanBlock;
  onChange: (next: HangmanBlock) => void;
};

type Word = HangmanBlock['words'][number];

function WordRow({
  word,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  word: Word;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<Word>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="space-y-2 rounded-md border p-2">
      <div className="flex items-center gap-2">
        <TextInput
          id={`hg-${word.id}-word`}
          value={word.word}
          onChange={(v) => onChange({ word: v.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '') })}
          placeholder={`Lösungswort ${index + 1} (GROSSBUCHSTABEN)`}
        />
        <ItemAction onClick={onRemove} label="✕" disabled={!canRemove} tone="destructive" />
      </div>
      <TextInput
        id={`hg-${word.id}-hint`}
        value={word.hint}
        onChange={(v) => onChange({ hint: v })}
        placeholder={'Hinweis (Pflicht), z.B. „Eingabegerät mit Tasten"'}
      />
    </li>
  );
}

export function HangmanForm({ value, onChange }: Props) {
  const set = <K extends keyof HangmanBlock>(key: K, v: HangmanBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updateWord(i: number, patch: Partial<Word>) {
    set(
      'words',
      value.words.map((w, idx) => (idx === i ? { ...w, ...patch } : w))
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
          placeholder={'z.B. „Errate die gesuchten Begriffe."'}
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        Erlaubte Fehlversuche (Herzen)
        <input
          type="number"
          min={3}
          max={10}
          value={value.maxWrong}
          onChange={(e) => set('maxWrong', Math.min(10, Math.max(3, Number(e.target.value))))}
          className="border-input bg-background h-9 w-16 rounded-md border px-2 text-sm"
        />
      </label>

      <div>
        <div className="mb-2 text-xs font-medium">Wörter (1–6)</div>
        <ul className="space-y-2">
          {value.words.map((word, i) => (
            <WordRow
              key={word.id}
              word={word}
              index={i}
              canRemove={value.words.length > 1}
              onChange={(patch) => updateWord(i, patch)}
              onRemove={() =>
                set(
                  'words',
                  value.words.filter((_, idx) => idx !== i)
                )
              }
            />
          ))}
        </ul>
        <div className="mt-2">
          {value.words.length < 6 && (
            <AddButton
              onClick={() =>
                set('words', [
                  ...value.words,
                  { id: makeOptionId(value.words, 'w'), word: '', hint: '' },
                ])
              }
            >
              Wort hinzufügen
            </AddButton>
          )}
        </div>
      </div>

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
