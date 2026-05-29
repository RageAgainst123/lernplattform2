'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';
import { BlockView } from '@/components/blocks/BlockView';
import { useDebouncedCallback } from '@/components/blocks/useDebouncedCallback';

type Props = {
  blocks: Block[];
  initialAnswers: Record<string, BlockAnswer>;
  // Wenn nicht null → Read-only-Modus (Schüler:in hat bereits abgegeben).
  initialSubmittedAt: string | null;
  onSaveDraft: (answers: Record<string, BlockAnswer>) => Promise<void>;
  onSubmit: (answers: Record<string, BlockAnswer>) => Promise<void>;
};

// Arbeitsblatt-Modus: alle Blöcke auf einer scrollbaren Seite. Auto-Save
// im Hintergrund (debounced). Definitive Abgabe via „Abgeben"-Button →
// danach Read-only. Keine Sofort-Bewertung (rote/grüne Markierung).

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBanner({ submittedAt }: { submittedAt: string | null }) {
  if (submittedAt) {
    return (
      <div className="bg-primary/10 border-primary/30 rounded-md border p-3 text-sm">
        ✓ Abgegeben am {formatDate(submittedAt)}. Du kannst nichts mehr ändern.
      </div>
    );
  }
  return (
    <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
      Deine Eingaben werden automatisch gespeichert. Wenn du fertig bist, klicke unten auf{' '}
      <strong>Abgeben</strong>.
    </div>
  );
}

type TaskBlockProps = {
  block: Block;
  index: number;
  answer: BlockAnswer | undefined;
  readOnly: boolean;
  onAnswer: (value: BlockAnswer) => void;
};

function TaskBlock({ block, index, answer, readOnly, onAnswer }: TaskBlockProps) {
  return (
    <section aria-labelledby={`task-${block.id}`} className="space-y-3 rounded-lg border p-4">
      <h2
        id={`task-${block.id}`}
        className="text-muted-foreground text-sm font-semibold tracking-wide uppercase"
      >
        Aufgabe {index + 1}
      </h2>
      <BlockView
        block={block}
        answer={answer}
        checked={false}
        readOnly={readOnly}
        onAnswer={onAnswer}
      />
    </section>
  );
}

// State-Bündel: Antworten, Submit-Status, Fehler. Vereint in eigenem Hook,
// damit der eigentliche Renderer schlank bleibt.
function useWorksheetState(
  initialAnswers: Record<string, BlockAnswer>,
  initialSubmittedAt: string | null,
  onSaveDraft: (a: Record<string, BlockAnswer>) => Promise<void>,
  onSubmit: (a: Record<string, BlockAnswer>) => Promise<void>
) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const readOnly = initialSubmittedAt !== null;

  const saveDraft = useDebouncedCallback<Record<string, BlockAnswer>>(async (next) => {
    try {
      await onSaveDraft(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    }
  }, 800);

  function updateAnswer(blockId: string, value: BlockAnswer) {
    if (readOnly) return;
    const next = { ...answers, [blockId]: value };
    setAnswers(next);
    saveDraft(next);
  }

  function handleSubmit() {
    if (readOnly) return;
    if (!confirm('Wirklich abgeben? Du kannst danach nichts mehr ändern.')) return;
    setError(null);
    startSubmit(async () => {
      try {
        await onSubmit(answers);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Abgabe fehlgeschlagen.');
      }
    });
  }

  return { answers, error, submitting, readOnly, updateAnswer, handleSubmit };
}

export function WorksheetRunner({
  blocks,
  initialAnswers,
  initialSubmittedAt,
  onSaveDraft,
  onSubmit,
}: Props) {
  const { answers, error, submitting, readOnly, updateAnswer, handleSubmit } = useWorksheetState(
    initialAnswers,
    initialSubmittedAt,
    onSaveDraft,
    onSubmit
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <StatusBanner submittedAt={initialSubmittedAt} />
      {blocks.map((block, i) => (
        <TaskBlock
          key={block.id}
          block={block}
          index={i}
          answer={answers[block.id]}
          readOnly={readOnly}
          onAnswer={(value) => updateAnswer(block.id, value)}
        />
      ))}
      {error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </p>
      )}
      {!readOnly && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? 'Wird abgegeben…' : 'Abgeben'}
          </Button>
        </div>
      )}
    </div>
  );
}
