'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ActivityKind } from '@/lib/schemas/entities';
import { duplicateModule } from '@/lib/db/module-actions';
import { ACTIVITY_INFO } from '@/lib/activities';
import { Button } from '@/components/ui/button';

// V4: dupliziert ein Modul als Entwurf (ohne Themen-Zuordnung) und springt
// direkt in den Editor der Kopie. Sicherer Workflow für Module mit
// Bestand-Fortschritt — siehe Warn-Banner im ModuleEditor.

type Props = {
  moduleId: string;
  activityKind: ActivityKind;
};

export function DuplicateModuleButton({ moduleId, activityKind }: Props) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        const { id } = await duplicateModule(moduleId);
        router.push(`/admin/${ACTIVITY_INFO[activityKind].urlSegment}/${id}`);
      } catch {
        // Listen-Seite hat keinen Error-State — kompakter Inline-Hinweis.
        setFailed(true);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={pending}
      title="Als Entwurfs-Kopie duplizieren"
      aria-label={`${ACTIVITY_INFO[activityKind].label} duplizieren`}
    >
      {pending ? 'Dupliziere…' : failed ? '⚠ Fehler' : '⧉ Duplizieren'}
    </Button>
  );
}
