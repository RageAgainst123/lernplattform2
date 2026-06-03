'use client';

import { useTransition } from 'react';
import { markWordHeftOpened, removeWordHeftLink } from '@/lib/db/word-heft-actions';
import type { WordHeftLink, ValidationStatus } from '@/lib/schemas/entities';
import { Button } from '@/components/ui/button';

// Sub-Komponente von WordHeftSlot: gezeigt wenn schon ein Link gespeichert ist.
// Zeigt Status-Badge + drei Aktionen (Öffnen / Aktualisieren / Entfernen).

function StatusBadge({ status }: { status: ValidationStatus }) {
  if (status === 'ok') {
    return <span className="text-xs text-green-700">✅ Link funktioniert</span>;
  }
  if (status === 'broken') {
    return (
      <span className="text-destructive text-xs">
        ⚠️ Link funktioniert nicht — Sharing-Einstellung in Word prüfen
      </span>
    );
  }
  if (status === 'unverified') {
    return (
      <span className="text-muted-foreground text-xs">
        ℹ️ Link gespeichert (deine Lehrer:in sieht beim ersten Klick ob er funktioniert)
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">Wird geprüft …</span>;
}

function ExistingLinkActions({
  onOpen,
  onUpdate,
  onRemove,
  pending,
}: {
  onOpen: () => void;
  onUpdate: () => void;
  onRemove: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={onOpen} disabled={pending}>
        📓 Heft öffnen
      </Button>
      <Button type="button" variant="outline" onClick={onUpdate} disabled={pending}>
        🔄 Link aktualisieren
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="text-destructive"
        onClick={onRemove}
        disabled={pending}
      >
        Entfernen
      </Button>
    </div>
  );
}

export function WordHeftSlotExisting({
  link,
  onUpdate,
  onRemove,
}: {
  link: WordHeftLink;
  onUpdate: () => void;
  onRemove: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    startTransition(() => markWordHeftOpened(link.id));
    window.open(link.oneDriveUrl, '_blank', 'noopener');
  }

  function handleRemove() {
    if (!confirm('Word-Heft-Link wirklich entfernen? Die Datei in OneDrive bleibt erhalten.')) {
      return;
    }
    startTransition(async () => {
      await removeWordHeftLink(link.id);
      onRemove();
    });
  }

  return (
    <div className="bg-muted/50 flex flex-col gap-3 rounded-md border p-4">
      <div>
        <p className="font-medium">📓 Mein Schulübungsheft (Word)</p>
        <p className="text-foreground mt-1 text-sm">{link.displayName ?? 'Heft in OneDrive'}</p>
        <StatusBadge status={link.validationStatus} />
      </div>
      <ExistingLinkActions
        onOpen={handleOpen}
        onUpdate={onUpdate}
        onRemove={handleRemove}
        pending={pending}
      />
    </div>
  );
}
