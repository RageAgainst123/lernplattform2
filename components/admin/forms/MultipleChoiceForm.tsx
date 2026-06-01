'use client';

import type { MultipleChoiceBlock } from '@/lib/schemas/blocks';
import {
  AddButton,
  FieldLabel,
  ItemAction,
  TextArea,
  TextInput,
  makeOptionId,
} from './form-helpers';

// Form-Editor für multiple_choice. Frage oben, darunter Optionen-Liste mit
// Checkbox (= „diese Antwort ist richtig"), Text-Input, Lösch-Knopf.
// Optional zwei Feedback-Felder unten (richtig/falsch).
//
// Mehrere richtige Antworten sind erlaubt (mehrere checkboxes können true sein).

type Props = {
  value: MultipleChoiceBlock;
  onChange: (next: MultipleChoiceBlock) => void;
};

export function MultipleChoiceForm({ value, onChange }: Props) {
  const set = <K extends keyof MultipleChoiceBlock>(key: K, v: MultipleChoiceBlock[K]) =>
    onChange({ ...value, [key]: v });

  function updateOption(idx: number, patch: Partial<MultipleChoiceBlock['options'][number]>) {
    set(
      'options',
      value.options.map((o, i) => (i === idx ? { ...o, ...patch } : o))
    );
  }

  function addOption() {
    set('options', [
      ...value.options,
      { id: makeOptionId(value.options), text: '', correct: false },
    ]);
  }

  function removeOption(idx: number) {
    if (value.options.length <= 2) return; // min 2 Optionen (Schema-Regel)
    set(
      'options',
      value.options.filter((_, i) => i !== idx)
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-question`}>Frage</FieldLabel>
        <TextArea
          id={`${value.id}-question`}
          value={value.question}
          onChange={(v) => set('question', v)}
          placeholder="Was ist die richtige Antwort?"
          rows={2}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Antwortmöglichkeiten</span>
          <span className="text-muted-foreground text-xs">
            ✓ markiert die richtige(n) Antwort(en)
          </span>
        </div>
        <ul className="space-y-2">
          {value.options.map((opt, i) => (
            <li
              key={opt.id}
              className={`flex items-start gap-2 rounded-md border p-2 ${
                opt.correct ? 'border-emerald-300 bg-emerald-50' : 'border-input'
              }`}
            >
              <label className="mt-1.5 flex shrink-0 cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={opt.correct}
                  onChange={(e) => updateOption(i, { correct: e.target.checked })}
                  className="size-4"
                  aria-label="Antwort ist richtig"
                />
                <span className="text-xs font-medium">{opt.correct ? 'richtig' : ''}</span>
              </label>
              <TextInput
                id={`${value.id}-opt-${opt.id}`}
                value={opt.text}
                onChange={(v) => updateOption(i, { text: v })}
                placeholder={`Antwort ${i + 1}`}
              />
              <div className="mt-1.5 shrink-0">
                <ItemAction
                  onClick={() => removeOption(i)}
                  label="✕"
                  disabled={value.options.length <= 2}
                  tone="destructive"
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addOption}>Antwort hinzufügen</AddButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${value.id}-fbc`}>Feedback bei richtiger Antwort</FieldLabel>
          <TextInput
            id={`${value.id}-fbc`}
            value={value.feedbackCorrect ?? ''}
            onChange={(v) => set('feedbackCorrect', v || undefined)}
            placeholder={'optional, z.B. „Gut gemacht!"'}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${value.id}-fbw`}>Feedback bei falscher Antwort</FieldLabel>
          <TextInput
            id={`${value.id}-fbw`}
            value={value.feedbackWrong ?? ''}
            onChange={(v) => set('feedbackWrong', v || undefined)}
            placeholder={'optional, z.B. „Versuch\'s nochmal!"'}
          />
        </div>
      </div>
    </div>
  );
}
