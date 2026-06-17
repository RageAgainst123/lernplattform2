'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { markWordHeftOpened } from '@/lib/db/word-heft-actions';
import { Button, buttonVariants } from '@/components/ui/button';

// Kompakter Hinweis-Card auf der Themen-Detailseite, der zum generellen
// Schulübungsheft führt. Drei Varianten:
//   - Sch:in hat Heft → "📓 Im Schulübungsheft notieren" + Link öffnet Word
//   - Sch:in hat KEIN Heft → Hinweis-Text + Link zu /s/heft/setup
//
// Das eigentliche Anlegen passiert NICHT pro Thema, sondern einmalig.

export type WordHeftHintProps = {
  hasHeft: boolean;
  topicLabel: string;
  /** Wenn vorhanden, "Heft öffnen" linkt direkt darauf. */
  oneDriveUrl?: string;
  /** Wenn vorhanden, last_opened wird beim Klick aktualisiert. */
  linkId?: string;
};

function NoHeftYet() {
  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-md border p-4">
      <p className="font-medium">📓 Tipp: dein Schulübungsheft</p>
      <p className="text-muted-foreground text-sm">
        Du kannst zu diesem Thema Notizen, Übungen oder Vorbereitung auf den Abschlusstest in dein
        Schulübungsheft schreiben. Lege es einmalig in deinem OneDrive an — danach steht es bei
        allen Themen zur Verfügung.
      </p>
      <Link href="/s/heft/word" className={buttonVariants({ variant: 'outline' })}>
        📓 Schulübungsheft einrichten
      </Link>
    </div>
  );
}

function HasHeft({
  topicLabel,
  oneDriveUrl,
  linkId,
}: {
  topicLabel: string;
  oneDriveUrl?: string;
  linkId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [opened, setOpened] = useState(false);

  function handleOpen() {
    if (!oneDriveUrl) return;
    if (linkId) startTransition(() => markWordHeftOpened(linkId));
    window.open(oneDriveUrl, '_blank', 'noopener');
    setOpened(true);
  }

  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-md border p-4">
      <p className="font-medium">📓 Notiere im Schulübungsheft</p>
      <p className="text-muted-foreground text-sm">
        Schreib deine Gedanken zu &bdquo;{topicLabel}&ldquo; in dein Schulübungsheft. Hilfreich als
        Vorbereitung auf den Abschlusstest.
      </p>
      <div className="flex flex-wrap gap-2">
        {oneDriveUrl ? (
          <Button type="button" onClick={handleOpen} disabled={pending}>
            {opened ? '✅ Geöffnet — Tab wechseln' : '📓 Heft in Word öffnen'}
          </Button>
        ) : (
          <Link href="/s/heft/word" className={buttonVariants()}>
            📓 Zum Heft
          </Link>
        )}
      </div>
    </div>
  );
}

export function WordHeftHint(props: WordHeftHintProps) {
  if (!props.hasHeft) return <NoHeftYet />;
  return (
    <HasHeft topicLabel={props.topicLabel} oneDriveUrl={props.oneDriveUrl} linkId={props.linkId} />
  );
}
