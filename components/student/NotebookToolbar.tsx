'use client';

import type { Editor } from '@tiptap/react';
import {
  ColorPicker,
  Divider,
  LinkButton,
  ToolbarButton,
  ToolbarGroup,
  type ToolbarSpec,
} from './NotebookToolbarParts';

// Erweiterte Toolbar für den Tiptap-Editor (Phase H+ Sub-B/C). Gruppen:
//   - Format: Fett, Kursiv, Unterstrichen, Durchgestrichen
//   - Block: Überschrift, Liste, Nummerierung
//   - Color: Textfarbe + Markierungsfarbe (Pop-Picker)
//   - Align: Links / Mitte / Rechts
//   - Link + Bild
//   - History: Undo / Redo
//
// Bilder können nach Einfügen via tiptap-extension-resize-image per Eck-
// Handles vergrößert/verkleinert werden — Tiptap rendert die Resize-Handles
// automatisch, kein Toolbar-Button nötig.

const TEXT_COLORS = [
  { value: '', label: 'Standard' },
  { value: '#dc2626', label: 'Rot' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#ca8a04', label: 'Gelb' },
  { value: '#16a34a', label: 'Grün' },
  { value: '#2563eb', label: 'Blau' },
  { value: '#9333ea', label: 'Lila' },
];

const HIGHLIGHT_COLORS = [
  { value: '', label: 'Aus' },
  { value: '#fef08a', label: 'Gelb' },
  { value: '#bbf7d0', label: 'Grün' },
  { value: '#bfdbfe', label: 'Blau' },
  { value: '#fbcfe8', label: 'Pink' },
];

function formatSpecs(editor: Editor): ToolbarSpec[] {
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
      active: editor.isActive('underline'),
      label: 'Unterstrichen',
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      icon: <span className="underline">U</span>,
    },
    {
      active: editor.isActive('strike'),
      label: 'Durchgestrichen',
      onClick: () => editor.chain().focus().toggleStrike().run(),
      icon: <span className="line-through">S</span>,
    },
  ];
}

function blockSpecs(editor: Editor): ToolbarSpec[] {
  return [
    {
      active: editor.isActive('heading', { level: 2 }),
      label: 'Überschrift',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: 'H',
    },
    {
      active: editor.isActive('bulletList'),
      label: 'Aufzählung',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: '•',
    },
    {
      active: editor.isActive('orderedList'),
      label: 'Nummerierte Liste',
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      icon: '1.',
    },
  ];
}

function alignSpecs(editor: Editor): ToolbarSpec[] {
  return [
    {
      active: editor.isActive({ textAlign: 'left' }),
      label: 'Links',
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
      icon: '⬅',
    },
    {
      active: editor.isActive({ textAlign: 'center' }),
      label: 'Mitte',
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
      icon: '↔',
    },
    {
      active: editor.isActive({ textAlign: 'right' }),
      label: 'Rechts',
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
      icon: '➡',
    },
  ];
}

function historySpecs(editor: Editor): ToolbarSpec[] {
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

export function NotebookToolbar({
  editor,
  onPickImage,
}: {
  editor: Editor | null;
  onPickImage?: () => void;
}) {
  if (!editor) return null;
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-1 rounded-md border p-1">
      <ToolbarGroup specs={formatSpecs(editor)} />
      <Divider />
      <ToolbarGroup specs={blockSpecs(editor)} />
      <Divider />
      <ColorPicker
        colors={TEXT_COLORS}
        label="Textfarbe"
        icon="A"
        onPick={(c) => {
          if (c) editor.chain().focus().setColor(c).run();
          else editor.chain().focus().unsetColor().run();
        }}
      />
      <ColorPicker
        colors={HIGHLIGHT_COLORS}
        label="Markieren"
        icon="🖍"
        onPick={(c) => {
          if (c) editor.chain().focus().toggleHighlight({ color: c }).run();
          else editor.chain().focus().unsetHighlight().run();
        }}
      />
      <Divider />
      <ToolbarGroup specs={alignSpecs(editor)} />
      <Divider />
      <LinkButton editor={editor} />
      {onPickImage && (
        <ToolbarButton active={false} onClick={onPickImage} label="Bild einfügen">
          📷
        </ToolbarButton>
      )}
      <Divider />
      <ToolbarGroup specs={historySpecs(editor)} />
    </div>
  );
}
