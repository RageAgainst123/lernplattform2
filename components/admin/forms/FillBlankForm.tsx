'use client';

import type { FillBlankBlock } from '@/lib/schemas/blocks';
import { AddButton, FieldLabel, ItemAction, TextArea, TextInput } from './form-helpers';

// Form-Editor für fill_blank (Lückentext). Textfeld mit {0}, {1}, … als
// Platzhalter, darunter Lösungen-Liste (Reihenfolge entspricht Platzhalter-
// Index) und optionale Distraktoren (zusätzliche Wörter im Wortpool).

type Props = {
  value: FillBlankBlock;
  onChange: (next: FillBlankBlock) => void;
};

export function FillBlankForm({ value, onChange }: Props) {
  const set = <K extends keyof FillBlankBlock>(key: K, v: FillBlankBlock[K]) =>
    onChange({ ...value, [key]: v });

  function setSolution(i: number, v: string) {
    set(
      'solutions',
      value.solutions.map((s, idx) => (idx === i ? v : s))
    );
  }
  function addSolution() {
    set('solutions', [...value.solutions, '']);
  }
  function removeSolution(i: number) {
    if (value.solutions.length <= 1) return;
    set(
      'solutions',
      value.solutions.filter((_, idx) => idx !== i)
    );
  }

  function setDistractor(i: number, v: string) {
    set(
      'distractors',
      value.distractors.map((d, idx) => (idx === i ? v : d))
    );
  }
  function addDistractor() {
    set('distractors', [...value.distractors, '']);
  }
  function removeDistractor(i: number) {
    set(
      'distractors',
      value.distractors.filter((_, idx) => idx !== i)
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor={`${value.id}-text`}>Text mit Lücken</FieldLabel>
        <TextArea
          id={`${value.id}-text`}
          value={value.text}
          onChange={(v) => set('text', v)}
          placeholder={'z.B. „Ein {0} ist ein Eingabegerät, ein {1} ein Ausgabegerät."'}
          rows={3}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Platzhalter <code className="bg-muted px-1">{'{0}'}</code>,{' '}
          <code className="bg-muted px-1">{'{1}'}</code>, … markieren die Lücken.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Lösungen (in Reihenfolge der Platzhalter)</span>
        </div>
        <ul className="space-y-1.5">
          {value.solutions.map((sol, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground w-10 shrink-0 text-right font-mono text-xs">
                {`{${i}}`}
              </span>
              <TextInput
                id={`${value.id}-sol-${i}`}
                value={sol}
                onChange={(v) => setSolution(i, v)}
                placeholder={`Lösung ${i + 1}`}
              />
              <ItemAction
                onClick={() => removeSolution(i)}
                label="✕"
                disabled={value.solutions.length <= 1}
                tone="destructive"
              />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={addSolution}>Lösung hinzufügen</AddButton>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Ablenker (zusätzliche Wörter im Pool)</span>
          <span className="text-muted-foreground text-xs">optional</span>
        </div>
        {value.distractors.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
            Keine Ablenker. Pool enthält nur die Lösungen.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {value.distractors.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <TextInput
                  id={`${value.id}-dist-${i}`}
                  value={d}
                  onChange={(v) => setDistractor(i, v)}
                  placeholder={`Falsches Wort ${i + 1}`}
                />
                <ItemAction onClick={() => removeDistractor(i)} label="✕" tone="destructive" />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2">
          <AddButton onClick={addDistractor}>Ablenker hinzufügen</AddButton>
        </div>
      </div>
    </div>
  );
}
