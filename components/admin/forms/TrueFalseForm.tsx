'use client';

import type { TrueFalseBlock } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea, TextInput } from './form-helpers';
import { GradedExtensionsFields } from './GradedExtensionsFields';

// Form-Editor für true_false. Frage, zwei Radio-Buttons (wahr/falsch),
// optionale Feedback-Texte.

type Props = {
  value: TrueFalseBlock;
  onChange: (next: TrueFalseBlock) => void;
};

export function TrueFalseForm({ value, onChange }: Props) {
  const set = <K extends keyof TrueFalseBlock>(key: K, v: TrueFalseBlock[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-q`}>Aussage</FieldLabel>
        <TextArea
          id={`${value.id}-q`}
          value={value.question}
          onChange={(v) => set('question', v)}
          placeholder={'z.B. „Ein Bildschirm ist ein Eingabegerät."'}
          rows={2}
        />
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium">Diese Aussage ist:</span>
        <div className="flex gap-2">
          <AnswerRadio
            name={`${value.id}-ans`}
            label="Wahr"
            checked={value.answer === true}
            onChange={() => set('answer', true)}
          />
          <AnswerRadio
            name={`${value.id}-ans`}
            label="Falsch"
            checked={value.answer === false}
            onChange={() => set('answer', false)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${value.id}-fbc`}>Feedback bei richtig</FieldLabel>
          <TextInput
            id={`${value.id}-fbc`}
            value={value.feedbackCorrect ?? ''}
            onChange={(v) => set('feedbackCorrect', v || undefined)}
            placeholder="optional"
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${value.id}-fbw`}>Feedback bei falsch</FieldLabel>
          <TextInput
            id={`${value.id}-fbw`}
            value={value.feedbackWrong ?? ''}
            onChange={(v) => set('feedbackWrong', v || undefined)}
            placeholder="optional"
          />
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

function AnswerRadio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
        checked ? 'border-emerald-300 bg-emerald-50' : 'border-input hover:bg-muted/40'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4" />
      {label}
    </label>
  );
}
