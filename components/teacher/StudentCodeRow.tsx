'use client';

import { useState, useTransition } from 'react';
import type { StudentCode } from '@/lib/schemas/entities';
import { regeneratePin } from '@/lib/db/student-code-actions';
import { Button } from '@/components/ui/button';

export function StudentCodeRow({ code }: { code: StudentCode }) {
  const [newPin, setNewPin] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regeneratePin(code.id, code.classId);
      if (result.pin) {
        setNewPin(result.pin);
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="font-mono text-sm">{code.codename}</span>
      <div className="flex items-center gap-3">
        {newPin ? (
          <span className="font-mono text-sm font-semibold">neue PIN: {newPin}</span>
        ) : (
          <span className="text-muted-foreground text-xs">PIN gesetzt</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={pending}
        >
          {pending ? '…' : 'PIN neu'}
        </Button>
      </div>
    </li>
  );
}
