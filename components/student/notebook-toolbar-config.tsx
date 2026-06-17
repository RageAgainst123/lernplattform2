import type { Editor } from '@tiptap/react';
import type { ToolbarSpec } from './NotebookToolbarParts';

// Konfigurations-Konstanten + Spec-Builder-Funktionen für die Notebook-
// Toolbar. Ausgelagert damit NotebookToolbar.tsx unter max-lines bleibt.

export const FONT_FAMILIES = [
  { value: '', label: 'Standard' },
  { value: 'Inter, system-ui, sans-serif', label: 'Sans-Serif' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
  { value: 'Courier New, monospace', label: 'Monospace' },
];

export const FONT_SIZES = [
  { value: '', label: 'Standard' },
  { value: '12px', label: '12 px' },
  { value: '14px', label: '14 px' },
  { value: '16px', label: '16 px' },
  { value: '18px', label: '18 px' },
  { value: '20px', label: '20 px' },
  { value: '24px', label: '24 px' },
  { value: '32px', label: '32 px' },
];

export const TEXT_COLORS = [
  { value: '', label: 'Standard' },
  { value: '#dc2626', label: 'Rot' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#ca8a04', label: 'Gelb' },
  { value: '#16a34a', label: 'Grün' },
  { value: '#2563eb', label: 'Blau' },
  { value: '#9333ea', label: 'Lila' },
];

export const HIGHLIGHT_COLORS = [
  { value: '', label: 'Aus' },
  { value: '#fef08a', label: 'Gelb' },
  { value: '#bbf7d0', label: 'Grün' },
  { value: '#bfdbfe', label: 'Blau' },
  { value: '#fbcfe8', label: 'Pink' },
];

export function formatSpecs(editor: Editor): ToolbarSpec[] {
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

export function blockSpecs(editor: Editor): ToolbarSpec[] {
  return [
    {
      active: editor.isActive('heading', { level: 1 }),
      label: 'Große Überschrift',
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: 'H1',
    },
    {
      active: editor.isActive('heading', { level: 2 }),
      label: 'Überschrift',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: 'H2',
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

export function alignSpecs(editor: Editor): ToolbarSpec[] {
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

export function historySpecs(editor: Editor): ToolbarSpec[] {
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

export function currentFontFamily(editor: Editor): string {
  return (editor.getAttributes('textStyle').fontFamily as string) ?? '';
}

export function currentFontSize(editor: Editor): string {
  return (editor.getAttributes('textStyle').fontSize as string) ?? '';
}
