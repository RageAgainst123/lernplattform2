'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import ResizeImage from 'tiptap-extension-resize-image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/components/blocks/useDebouncedCallback';
import { updatePortfolioEntry, deletePortfolioEntry } from '@/lib/db/portfolio-actions';
import { NotebookToolbar } from './NotebookToolbar';
import { ImagePickerDialog } from './ImagePickerDialog';
import type { PexelsImage } from '@/lib/pexels';

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

  const [saveTitle] = useDebouncedCallback<string>((v) => persist({ title: v }), 1500);
  const [saveContent, flushContent] = useDebouncedCallback<Record<string, unknown>>(
    (c) => persist({ contentJson: c }),
    1500
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      ResizeImage,
    ],
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

  return { editor, status, saveTitle, flushContent };
}

// Pexels-Bild in den Editor einsetzen. Pexels-Photographer-Info im title-
// Attribut (Hover-Tooltip), damit Attribution rekonstruierbar bleibt.
function insertImage(editor: Editor | null, image: PexelsImage) {
  if (!editor) return;
  editor
    .chain()
    .focus()
    .setImage({
      src: image.full,
      alt: image.alt || `Foto von ${image.photographer} (Pexels)`,
      title: `© ${image.photographer} via Pexels`,
    })
    .run();
}

export function NotebookEditor({ entryId, initialTitle, initialContent }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { editor, status, saveTitle, flushContent } = useNotebookEditor(entryId, initialContent);

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

  // H+ Sub-A: Bild-Speicher-Bug-Fix. setImage triggert zwar onUpdate →
  // saveContent, aber der 1500ms-Debounce kann verloren gehen wenn der
  // User direkt nach dem Einfügen navigiert. flushContent() persistiert
  // sofort statt zu warten.
  async function handlePickImage(image: PexelsImage) {
    insertImage(editor, image);
    setPickerOpen(false);
    // Kurz warten bis Tiptap's onUpdate gefeuert hat (microtask + nächster
    // tick), dann flushen.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushContent();
  }

  return (
    <div className="space-y-3">
      <TitleRow title={title} onChange={handleTitleChange} status={status} />
      <NotebookToolbar editor={editor} onPickImage={() => setPickerOpen(true)} />
      <EditorContent editor={editor} />
      <ActionBar pending={pending} onBack={() => router.push('/s/heft')} onDelete={handleDelete} />
      <ImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickImage}
      />
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
