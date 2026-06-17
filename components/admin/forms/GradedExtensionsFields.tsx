'use client';

import { BLOCK_CATEGORIES, type BlockCategory } from '@/lib/schemas/blocks';
import { FieldLabel, TextArea } from './form-helpers';

// Phase W (2026-06): gemeinsame Felder für bewertbare Block-Forms.
// Wird in MultipleChoice/TrueFalse/FillBlank/Match unten eingebaut.
//
// Felder:
//   - hint: optionaler Hinweistext, der nach 1. Fehlversuch erscheint
//   - maxAttempts: 1-5 (default 1)
//   - category: theorie | uebung | reflexion (für BlockList-Gruppierung)

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  theorie: 'Theorie',
  uebung: 'Übung',
  reflexion: 'Reflexion',
};

type Props = {
  blockId: string;
  hint: string | undefined;
  maxAttempts: number | undefined;
  category: BlockCategory | undefined;
  onChange: (patch: {
    hint?: string | undefined;
    maxAttempts?: number | undefined;
    category?: BlockCategory | undefined;
  }) => void;
};

export function GradedExtensionsFields({ blockId, hint, maxAttempts, category, onChange }: Props) {
  return (
    <details className="rounded-md border border-dashed p-3" open={Boolean(hint || maxAttempts)}>
      <summary className="cursor-pointer text-xs font-medium">
        Didaktik-Feinheiten{' '}
        <span className="text-muted-foreground">(Hinweis, Mehrfachversuch)</span>
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <FieldLabel htmlFor={`${blockId}-hint`}>
            Hinweis bei falscher Antwort{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </FieldLabel>
          <TextArea
            id={`${blockId}-hint`}
            value={hint ?? ''}
            onChange={(v) => onChange({ hint: v.trim() ? v : undefined })}
            placeholder={'z.B. „Denke an die Reihenfolge der EVA-Phasen."'}
            rows={2}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${blockId}-attempts`}>Max. Versuche</FieldLabel>
            <select
              id={`${blockId}-attempts`}
              value={maxAttempts ?? 1}
              onChange={(e) => {
                const n = Number(e.target.value);
                onChange({ maxAttempts: n === 1 ? undefined : n });
              }}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value={1}>1 (Standard)</option>
              <option value={2}>2 (−25 % beim 2. Versuch)</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${blockId}-cat`}>Kategorie</FieldLabel>
            <select
              id={`${blockId}-cat`}
              value={category ?? ''}
              onChange={(e) => {
                const v = e.target.value as BlockCategory | '';
                onChange({ category: v === '' ? undefined : v });
              }}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">— keine —</option>
              {BLOCK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </details>
  );
}
