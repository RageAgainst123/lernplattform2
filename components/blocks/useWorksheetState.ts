'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { useDebouncedCallback } from '@/components/blocks/useDebouncedCallback';
import type { SaveState } from '@/components/blocks/WorksheetStatusBanner';

// State-Bündel für den Worksheet-Modus: Antworten, Submit-Status, Save-
// Status, Fehler. Hält die Render-Komponente klein.

export type WorksheetState = {
  answers: Record<string, BlockAnswer>;
  error: string | null;
  submitting: boolean;
  readOnly: boolean;
  saveState: SaveState;
  lastSavedAt: Date | null;
  updateAnswer: (blockId: string, value: BlockAnswer) => void;
  handleSubmit: () => void;
};

type SaveDraftFn = (a: Record<string, BlockAnswer>) => Promise<void>;
type SubmitFn = SaveDraftFn;

// Auto-Save-Wrapper: setzt Save-Status vor/nach dem Aufruf und persistiert
// den Fehler in den lokalen Error-Zustand.
function useAutoSave(onSaveDraft: SaveDraftFn) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveDraft = useDebouncedCallback<Record<string, BlockAnswer>>(async (next) => {
    setSaveState('saving');
    try {
      await onSaveDraft(next);
      setSaveState('saved');
      setLastSavedAt(new Date());
    } catch (e) {
      setSaveState('error');
      setSaveError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    }
  }, 800);
  return { saveDraft, saveState, lastSavedAt, saveError };
}

export function useWorksheetState(
  initialAnswers: Record<string, BlockAnswer>,
  initialSubmittedAt: string | null,
  onSaveDraft: SaveDraftFn,
  onSubmit: SubmitFn
): WorksheetState {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const { saveDraft, saveState, lastSavedAt, saveError } = useAutoSave(onSaveDraft);
  const readOnly = initialSubmittedAt !== null;

  function updateAnswer(blockId: string, value: BlockAnswer) {
    if (readOnly) return;
    const next = { ...answers, [blockId]: value };
    setAnswers(next);
    saveDraft(next);
  }

  function handleSubmit() {
    if (readOnly) return;
    if (!confirm('Wirklich abgeben? Du kannst danach nichts mehr ändern.')) return;
    setSubmitError(null);
    startSubmit(async () => {
      try {
        await onSubmit(answers);
        router.refresh();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Abgabe fehlgeschlagen.');
      }
    });
  }

  return {
    answers,
    error: submitError ?? saveError,
    submitting,
    readOnly,
    saveState,
    lastSavedAt,
    updateAnswer,
    handleSubmit,
  };
}
