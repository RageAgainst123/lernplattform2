'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/components/blocks/useDebouncedCallback';
import { updatePortfolioEntry, deletePortfolioEntry } from '@/lib/db/portfolio-actions';
import { NotebookToolbar } from './NotebookToolbar';

// Tiptap-basierter Heft-Editor (Phase H1). Minimale Toolbar: Fett, Kursiv,
// Liste, Highlight, Undo/Redo. Auto-Save via useDebouncedCallback (1500ms
// Debounce) auf updatePortfolioEntry. Titel separat oben, mit eigenem
// Auto-Save-Pfad.
//
// In Phase H2 kommt der Pexels-Bild-Picker dazu — wird hier als optionaler
// Knopf in der Toolbar eingehängt.

type Props = {
  entryId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Kapselt Save-State + Tiptap-Editor-Setup. Eltern-Komponente bleibt unter
// dem max-lines-per-function-Limit.
function useNotebookEditor(entryId: string, initialContent: Record<string, unknown>) {
  const [status, setStatus] = useState<SaveStatus>('idle');

  async function persist(patch: { title?: string; contentJson?: Record<string, unknown> }) {
    setStatus('saving');
    const result = await updatePortfolioEntry(entryId, patch);
    setStatus(result.error ? 'error' : 'saved');
  }

  const saveTitle = useDebouncedCallback<string>((v) => persist({ title: v }), 1500);
  const saveContent = useDebouncedCallback<Record<string, unknown>>(
    (c) => persist({ contentJson: c }),
    1500
  );

  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: hasContent(initialContent) ? initialContent : '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      saveContent(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] rounded-md border border-input bg-background p-3',
      },
    },
  });

  return { editor, status, saveTitle };
}

export function NotebookEditor({ entryId, initialTitle, initialContent }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [pending, startTransition] = useTransition();
  const { editor, status, saveTitle } = useNotebookEditor(entryId, initialContent);

  function handleTitleChange(v: string) {
    setTitle(v);
    saveTitle(v);
  }

  function handleDelete() {
    if (!window.confirm('Diesen Heft-Eintrag wirklich löschen?')) return;
    startTransition(async () => {
      try {
        await deletePortfolioEntry(entryId);
      } catch (e) {
        window.alert(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <TitleRow title={title} onChange={handleTitleChange} status={status} />
      <NotebookToolbar editor={editor} />
      <EditorContent editor={editor} />
      <ActionBar pending={pending} onBack={() => router.push('/s/heft')} onDelete={handleDelete} />
    </div>
  );
}

function TitleRow({
  title,
  onChange,
  status,
}: {
  title: string;
  onChange: (v: string) => void;
  status: SaveStatus;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Titel deines Eintrags"
        className="border-input bg-background h-10 flex-1 rounded-md border px-3 text-lg font-medium"
      />
      <SaveBadge status={status} />
    </div>
  );
}

function ActionBar({
  pending,
  onBack,
  onDelete,
}: {
  pending: boolean;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <Button variant="ghost" size="sm" onClick={onBack} disabled={pending}>
        ← Zurück zum Heft
      </Button>
      <Button variant="outline" size="sm" onClick={onDelete} disabled={pending}>
        {pending ? 'Lösche…' : 'Eintrag löschen'}
      </Button>
    </div>
  );
}

function hasContent(c: Record<string, unknown>): boolean {
  return Object.keys(c).length > 0;
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const label =
    status === 'saving'
      ? 'Speichere…'
      : status === 'saved'
        ? 'Gespeichert ✓'
        : status === 'error'
          ? 'Fehler beim Speichern'
          : '';
  const cls =
    status === 'error'
      ? 'text-destructive'
      : status === 'saved'
        ? 'text-emerald-600'
        : 'text-muted-foreground';
  return (
    <span className={`shrink-0 text-xs tabular-nums ${cls}`} aria-live="polite">
      {label}
    </span>
  );
}
