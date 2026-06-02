'use client';

import { useState, useTransition } from 'react';
import { deleteClass } from '@/lib/db/class-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Lösch-Button mit Bestätigungs-Dialog (Klassennamen tippen).
// Sehr destruktiv → Cascade löscht Schüler:innen-Codes, Zuweisungen,
// Live-Sessions, Hefte etc. Daher 2-Schritt + Namens-Eingabe.

function ConfirmActions({
  className,
  confirmInput,
  pending,
  onConfirm,
  onCancel,
}: {
  className: string;
  confirmInput: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onConfirm}
        disabled={pending || confirmInput.trim() !== className}
      >
        {pending ? 'Lösche …' : 'Endgültig löschen'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
        Abbrechen
      </Button>
    </div>
  );
}

function ConfirmBox({
  className,
  confirmInput,
  setConfirmInput,
  error,
  pending,
  onConfirm,
  onCancel,
}: {
  className: string;
  confirmInput: string;
  setConfirmInput: (v: string) => void;
  error: string | null;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-md border p-4">
      <p className="text-sm">
        <strong>Klasse unwiderruflich löschen?</strong>
        <br />
        Alle Schüler:innen-Zugänge, Modul-Zuweisungen, Lern-Fortschritte und Hefte werden mit
        gelöscht. Zur Bestätigung den Klassennamen eintippen:
      </p>
      <Input
        type="text"
        value={confirmInput}
        onChange={(e) => setConfirmInput(e.target.value)}
        placeholder={className}
        disabled={pending}
        autoFocus
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <ConfirmActions
        className={className}
        confirmInput={confirmInput}
        pending={pending}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}

export function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteClass(classId, confirmInput);
      if (result?.error) setError(result.error);
    });
  }

  function handleCancel() {
    setOpen(false);
    setConfirmInput('');
    setError(null);
  }

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Klasse löschen
      </Button>
    );
  }

  return (
    <ConfirmBox
      className={className}
      confirmInput={confirmInput}
      setConfirmInput={setConfirmInput}
      error={error}
      pending={pending}
      onConfirm={handleDelete}
      onCancel={handleCancel}
    />
  );
}
