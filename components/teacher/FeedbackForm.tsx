'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcwIcon } from 'lucide-react';
import { returnSubmissionWithFeedback, saveFeedbackOnly } from '@/lib/db/teacher-feedback-actions';
import { Button } from '@/components/ui/button';

// Feedback-Formular der Abgabe-Detailseite. Zwei Aktionen:
//   - „Zur Überarbeitung zurückgeben" → entsperrt das Modul für die Schüler:in
//   - „Feedback speichern" → speichert nur, Modul bleibt gesperrt
// manualMarks kommen vom Eltern-Wrapper (gemeinsamer State mit den Reflexions-
// Häkchen). Bei Erfolg router.refresh() → Seite zeigt aktualisierten Stand.

type Props = {
  classId: string;
  studentCodeId: string;
  moduleId: string;
  initialFeedback: string | null;
  returnedAt: string | null;
  manualMarks: Record<string, boolean>;
};

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

// Kapselt State + die beiden Server-Action-Aufrufe, hält die Komponente schlank.
function useFeedbackActions(
  classId: string,
  studentCodeId: string,
  moduleId: string,
  manualMarks: Record<string, boolean>,
  initialFeedback: string | null
) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: typeof returnSubmissionWithFeedback, withConfirm: boolean) {
    if (withConfirm && !confirm('Das Modul wird für die Schüler:in entsperrt. Fortfahren?')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await action(classId, studentCodeId, moduleId, feedback, manualMarks);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return {
    feedback,
    setFeedback,
    error,
    pending,
    handleReturn: () => run(returnSubmissionWithFeedback, true),
    handleSave: () => run(saveFeedbackOnly, false),
  };
}

export function FeedbackForm({
  classId,
  studentCodeId,
  moduleId,
  initialFeedback,
  returnedAt,
  manualMarks,
}: Props) {
  const s = useFeedbackActions(classId, studentCodeId, moduleId, manualMarks, initialFeedback);

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Feedback an die Schüler:in</h2>
        {returnedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <RotateCcwIcon className="size-3.5" aria-hidden />
            Zurückgegeben am {formatDate(returnedAt)}
          </span>
        )}
      </div>
      <textarea
        className="w-full rounded-md border p-3 text-sm"
        rows={4}
        value={s.feedback}
        placeholder="Kurzes Feedback, z. B. was noch zu verbessern ist…"
        onChange={(e) => s.setFeedback(e.target.value)}
        disabled={s.pending}
      />
      {s.error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
          {s.error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={s.handleSave} disabled={s.pending}>
          Feedback speichern
        </Button>
        <Button onClick={s.handleReturn} disabled={s.pending}>
          Zur Überarbeitung zurückgeben
        </Button>
      </div>
    </div>
  );
}
