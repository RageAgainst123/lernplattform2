'use client';

import { useState, useTransition } from 'react';
import { saveWordHeftLink } from '@/lib/db/word-heft-actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WordHeftInstructionsModal } from './WordHeftInstructionsModal';

// Sub-Komponente von WordHeftSlot: gezeigt wenn (a) noch kein Heft angelegt
// ist ODER (b) der User explizit "Link aktualisieren" geklickt hat.
//
// Drei Aktionen:
//   - "Word in neuem Tab öffnen" (externer Link zu office.com/word)
//   - "Anleitung" (Modal mit Schritt-für-Schritt)
//   - "Ich habe schon einen Link" → klappt Eingabefeld auf

function NoLinkActions({
  onShowInstructions,
  onToggleInput,
  showInput,
}: {
  onShowInstructions: () => void;
  onToggleInput: () => void;
  showInput: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="https://www.office.com/launch/word?auth=2"
        target="_blank"
        rel="noopener"
        className={buttonVariants({ variant: 'default' })}
      >
        ➜ Word in neuem Tab öffnen
      </a>
      <Button type="button" variant="outline" onClick={onShowInstructions}>
        ❓ Anleitung
      </Button>
      <Button type="button" variant="outline" onClick={onToggleInput}>
        {showInput ? 'Eingabe schließen' : '🔗 Ich habe schon einen Link'}
      </Button>
    </div>
  );
}

function LinkInputBlock({
  url,
  setUrl,
  error,
  pending,
  onSave,
}: {
  url: string;
  setUrl: (v: string) => void;
  error: string | null;
  pending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <label htmlFor="word-link-input" className="text-sm font-medium">
        Freigabe-Link aus Word einfügen:
      </label>
      <Input
        id="word-link-input"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://nms-pitten-my.sharepoint.com/..."
        disabled={pending}
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="button" onClick={onSave} disabled={pending || url.trim().length === 0}>
        {pending ? 'Wird geprüft …' : 'Link speichern'}
      </Button>
    </div>
  );
}

function useSaveLink(topicId: string, topicLabel: string, onSaved: () => void) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveWordHeftLink({
        topicId,
        oneDriveUrl: url,
        displayName: `${topicLabel}.docx`,
      });
      if (result.ok) {
        setUrl('');
        onSaved();
      } else {
        setError(result.error ?? 'Speichern fehlgeschlagen.');
      }
    });
  }

  return { url, setUrl, error, pending, save };
}

function EmptyHeader({ topicLabel }: { topicLabel: string }) {
  return (
    <div>
      <p className="font-medium">📝 Mein Word-Heft zu &bdquo;{topicLabel}&ldquo;</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Lege dein Heft in deinem OneDrive an (Word-Web) und klebe den Freigabe-Link hier ein.
      </p>
    </div>
  );
}

export function WordHeftSlotEmpty({
  topicId,
  topicLabel,
  onSaved,
}: {
  topicId: string;
  topicLabel: string;
  onSaved: () => void;
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const { url, setUrl, error, pending, save } = useSaveLink(topicId, topicLabel, () => {
    setShowInput(false);
    onSaved();
  });

  return (
    <div className="bg-muted/50 flex flex-col gap-3 rounded-md border p-4">
      <EmptyHeader topicLabel={topicLabel} />
      <NoLinkActions
        onShowInstructions={() => setShowInstructions(true)}
        onToggleInput={() => setShowInput((v) => !v)}
        showInput={showInput}
      />
      {showInput && (
        <LinkInputBlock url={url} setUrl={setUrl} error={error} pending={pending} onSave={save} />
      )}
      {showInstructions && <WordHeftInstructionsModal onClose={() => setShowInstructions(false)} />}
    </div>
  );
}
