'use client';

import type { ScrambleBlock } from '@/lib/schemas/blocks';
import { scrambledLetters } from '@/lib/blocks/scramble';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { AddButton, FieldLabel, ItemAction, TextInput, makeOptionId } from './form-helpers';

// Form-Editor für den Buchstabensalat: Wort-Liste (Wort auto-uppercase +
// optionaler Hinweis) mit Mini-Vorschau der gemischten Buchstaben — dieselbe
// deterministische Mischung wie im Schüler-Renderer.

type Props = {
  value: ScrambleBlock;
  onChange: (next: ScrambleBlock) => void;
};

type Word = ScrambleBlock['words'][number];

function WordRow({
  blockId,
  word,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  blockId: string;
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
          id={`sc-${word.id}-word`}
          value={word.word}
          onChange={(v) => onChange({ word: v.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '') })}
          placeholder={`Lösungswort ${index + 1} (GROSSBUCHSTABEN)`}
        />
        <ItemAction onClick={onRemove} label="✕" disabled={!canRemove} tone="destructive" />
      </div>
      <TextInput
        id={`sc-${word.id}-hint`}
        value={word.hint ?? ''}
        onChange={(v) => onChange({ hint: v || undefined })}
        placeholder={'Hinweis (optional), z.B. „Eingabegerät mit Tasten"'}
      />
      {word.word.length >= 2 && (
        <p className="text-muted-foreground font-mono text-xs">
          Vorschau: {scrambledLetters(word.word, `${blockId}:${word.id}`).join(' ')}
        </p>
      )}
    </li>
  );
}

export function ScrambleForm({ value, onChange }: Props) {
  const set = <K extends keyof ScrambleBlock>(key: K, v: ScrambleBlock[K]) =>
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
          placeholder={'z.B. „Bringe die Buchstaben in die richtige Reihenfolge."'}
        />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Wörter (1–8)</div>
        <ul className="space-y-2">
          {value.words.map((word, i) => (
            <WordRow
              key={word.id}
              blockId={value.id}
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
          {value.words.length < 8 && (
            <AddButton
              onClick={() =>
                set('words', [...value.words, { id: makeOptionId(value.words, 'w'), word: '' }])
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
