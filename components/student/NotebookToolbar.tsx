'use client';

import type { Editor } from '@tiptap/react';

// Toolbar für den Tiptap-Editor (Phase H1). In eigene Datei extrahiert
// damit der NotebookEditor unter max-lines bleibt. Bei Pexels-Bild-Picker
// (Phase H2) kommt ein weiteres Item dazu.

type ToolbarSpec = {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
};

function formatToolbarSpecs(editor: Editor): ToolbarSpec[] {
  return [
    {
      active: editor.isActive('bold'),
      label: 'Fett',
      onClick: () => editor.chain().focus().toggleBold().run(),
      icon: <strong>B</strong>,
    },
    {
      active: editor.isActive('italic'),
      label: 'Kursiv',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      icon: <em>I</em>,
    },
    {
      active: editor.isActive('bulletList'),
      label: 'Liste',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: '•',
    },
    {
      active: editor.isActive('heading', { level: 2 }),
      label: 'Überschrift',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: 'H',
    },
    {
      active: editor.isActive('highlight'),
      label: 'Markieren',
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      icon: '🖍',
    },
  ];
}

function historyToolbarSpecs(editor: Editor): ToolbarSpec[] {
  return [
    {
      active: false,
      label: 'Rückgängig',
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      icon: '↶',
    },
    {
      active: false,
      label: 'Wiederholen',
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      icon: '↷',
    },
  ];
}

export function NotebookToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const format = formatToolbarSpecs(editor);
  const history = historyToolbarSpecs(editor);
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-1 rounded-md border p-1">
      {format.map((s) => (
        <ToolbarButton key={s.label} {...s}>
          {s.icon}
        </ToolbarButton>
      ))}
      <div className="bg-border mx-1 h-5 w-px" />
      {history.map((s) => (
        <ToolbarButton key={s.label} {...s}>
          {s.icon}
        </ToolbarButton>
      ))}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`h-8 min-w-8 rounded px-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
      }`}
    >
      {children}
    </button>
  );
}
