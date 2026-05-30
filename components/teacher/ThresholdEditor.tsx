'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setPassThreshold } from '@/lib/db/class-module-actions';
import { Button } from '@/components/ui/button';

// Inline-Editor für die Bestehens-Schwelle einer Zuweisung. Leeres Feld =
// keine Schwelle (null). Teil von AssignedRow. Speichert via setPassThreshold
// (User-Client + RLS), danach router.refresh().

type Props = {
  classId: string;
  moduleId: string;
  current: number | null;
};

export function ThresholdEditor({ classId, moduleId, current }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(current === null ? '' : String(current));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = (current === null ? '' : String(current)) !== value;

  function handleSave() {
    setError(null);
    const parsed = value.trim() === '' ? null : Number(value);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100)) {
      setError('0–100');
      return;
    }
    startTransition(async () => {
      const result = await setPassThreshold(classId, moduleId, parsed);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <label className="text-muted-foreground text-xs" htmlFor={`thr-${moduleId}`}>
        Bestehen ab
      </label>
      <input
        id={`thr-${moduleId}`}
        type="number"
        min={0}
        max={100}
        value={value}
        placeholder="—"
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className="border-input bg-background h-8 w-16 rounded-md border px-2 text-sm"
      />
      <span className="text-muted-foreground text-xs">%</span>
      {dirty && (
        <Button variant="outline" size="sm" onClick={handleSave} disabled={pending}>
          Speichern
        </Button>
      )}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
