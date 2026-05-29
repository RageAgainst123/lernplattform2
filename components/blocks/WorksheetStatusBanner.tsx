'use client';

import { SaveIcon, Loader2Icon, CheckIcon, AlertTriangleIcon } from 'lucide-react';

// Banner über dem Worksheet-Modus: zeigt entweder den Auto-Save-Status
// (Idle / Saving / Saved / Error) oder die definitive Abgabe-Bestätigung.
// Wird in `WorksheetRunner` einmal gerendert.

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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

function formatTime(d: Date): string {
  return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
}

function DraftStatusLine({
  saveState,
  lastSavedAt,
}: {
  saveState: SaveState;
  lastSavedAt: Date | null;
}) {
  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-2">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Speichere…
      </span>
    );
  }
  if (saveState === 'saved' && lastSavedAt) {
    return (
      <span className="flex items-center gap-2">
        <CheckIcon className="size-4 text-green-600" aria-hidden />
        Gespeichert um {formatTime(lastSavedAt)}
      </span>
    );
  }
  if (saveState === 'error') {
    return (
      <span className="text-destructive flex items-center gap-2">
        <AlertTriangleIcon className="size-4" aria-hidden />
        Speichern fehlgeschlagen — bitte erneut versuchen.
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <SaveIcon className="size-4" aria-hidden />
      Deine Eingaben werden automatisch gespeichert. Wenn du fertig bist, klicke unten auf{' '}
      <strong>Abgeben</strong>.
    </span>
  );
}

export function WorksheetStatusBanner({
  submittedAt,
  saveState,
  lastSavedAt,
}: {
  submittedAt: string | null;
  saveState: SaveState;
  lastSavedAt: Date | null;
}) {
  if (submittedAt) {
    return (
      <div className="bg-primary/10 border-primary/30 rounded-md border p-3 text-sm">
        ✓ Abgegeben am {formatDate(submittedAt)}. Du kannst nichts mehr ändern.
      </div>
    );
  }
  return (
    <div className="bg-primary/5 border-primary/20 rounded-md border p-3 text-sm">
      <DraftStatusLine saveState={saveState} lastSavedAt={lastSavedAt} />
    </div>
  );
}
