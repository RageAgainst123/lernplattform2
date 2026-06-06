'use client';

import { useMemo } from 'react';
import type { MarkWordsBlock } from '@/lib/schemas/blocks';
import { tokenize } from '@/lib/blocks/tokenize';
import { cn } from '@/lib/utils';
import { GradedExtensionsFields } from './GradedExtensionsFields';
import { FieldLabel, TextArea, TextInput } from './form-helpers';

// Form-Editor für mark_words (Markieren im Text). Die Lösung wird WYSIWYG
// gesetzt: der/die Autor:in tippt in der tokenisierten Vorschau die Wörter an,
// die als richtig gelten. So nutzen Form UND Renderer dieselbe tokenize()-
// Funktion → die Wort-Indizes können nicht driften.

type Props = {
  value: MarkWordsBlock;
  onChange: (next: MarkWordsBlock) => void;
};

// Klickbare Wort-Vorschau: markierte (= richtige) Wörter sind hervorgehoben.
function SolutionPreview({
  text,
  correct,
  onToggle,
}: {
  text: string;
  correct: Set<number>;
  onToggle: (wordIndex: number) => void;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  if (tokens.length === 0) {
    return <p className="text-muted-foreground text-sm italic">Erst Text eingeben …</p>;
  }
  return (
    <p className="leading-relaxed">
      {tokens.map((tok, i) => {
        if (!tok.isWord || tok.wordIndex === null) return <span key={i}>{tok.text}</span>;
        const wi = tok.wordIndex;
        const isCorrect = correct.has(wi);
        return (
          <button
            key={i}
            type="button"
            aria-pressed={isCorrect}
            onClick={() => onToggle(wi)}
            className={cn(
              'rounded px-0.5',
              isCorrect ? 'bg-green-200 text-green-900' : 'hover:bg-muted'
            )}
          >
            {tok.text}
          </button>
        );
      })}
    </p>
  );
}

export function MarkWordsForm({ value, onChange }: Props) {
  const correct = useMemo(() => new Set(value.correctIndices), [value.correctIndices]);

  function toggle(wordIndex: number) {
    const next = new Set(correct);
    if (next.has(wordIndex)) next.delete(wordIndex);
    else next.add(wordIndex);
    onChange({ ...value, correctIndices: [...next].sort((a, b) => a - b) });
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-instruction`}>Aufgabenstellung</FieldLabel>
        <TextInput
          id={`${value.id}-instruction`}
          value={value.instruction}
          onChange={(v) => onChange({ ...value, instruction: v })}
          placeholder={'z.B. „Markiere alle persönlichen Daten."'}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${value.id}-text`}>Text</FieldLabel>
        <TextArea
          id={`${value.id}-text`}
          value={value.text}
          onChange={(v) => onChange({ ...value, text: v })}
          placeholder="Der Fließtext, in dem markiert wird."
          rows={3}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${value.id}-solution`}>
          Lösung — tippe die richtig zu markierenden Wörter an
        </FieldLabel>
        <div id={`${value.id}-solution`} className="rounded-md border p-3 text-base">
          <SolutionPreview text={value.text} correct={correct} onToggle={toggle} />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {correct.size} Wort{correct.size === 1 ? '' : 'e'} als richtig markiert.
        </p>
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
