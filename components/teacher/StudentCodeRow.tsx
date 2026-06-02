'use client';

import { useState, useTransition } from 'react';
import type { StudentCode } from '@/lib/schemas/entities';
import { regeneratePin } from '@/lib/db/student-code-actions';
import { studentDisplayName } from '@/lib/db/student-display-name';
import { Button } from '@/components/ui/button';

// Phase O: zeigt Anzeige-Namen statt Codename (Vorname Nachname für SSO,
// Codename als Fallback für Code+PIN). isSso erkennt SSO-Schüler:innen über
// o365Email — sie haben keine PIN, also wird der "PIN neu"-Button ausgeblendet.

export function StudentCodeRow({ code }: { code: StudentCode }) {
  const [newPin, setNewPin] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const displayName = studentDisplayName(code);
  const isSso = Boolean(code.o365Email);

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
      <div className="flex flex-col">
        <span className="text-sm font-medium">{displayName}</span>
        {isSso ? (
          <span className="text-muted-foreground text-xs">🪪 {code.o365Email}</span>
        ) : (
          <span className="text-muted-foreground font-mono text-xs">{code.codename}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isSso ? (
          <span className="text-muted-foreground text-xs">Microsoft-Login</span>
        ) : (
          <>
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
          </>
        )}
      </div>
    </li>
  );
}
