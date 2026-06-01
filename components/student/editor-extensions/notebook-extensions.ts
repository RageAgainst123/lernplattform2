import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { FontSize } from './FontSize';

// Zentrale Extension-Liste für den Notebook-Editor. Ausgelagert damit
// NotebookEditor unter max-lines-per-function bleibt.
//
// WICHTIG (Phase H+ Vollausbau):
//   - Image-Extension nutzt Tiptap-v3-eigenes Resize (resize.enabled=true).
//     Die vorherige community-Extension tiptap-extension-resize-image hatte
//     Schema-Probleme die dazu führten dass Bilder beim Re-Mount aus dem
//     gespeicherten JSON gefiltert wurden.
//   - Table-Extension mit resizable Columns.

export const notebookExtensions = [
  StarterKit,
  Underline,
  Highlight.configure({ multicolor: true }),
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Link.configure({ openOnClick: false, autolink: true }),
  Image.configure({
    inline: false,
    allowBase64: false,
    resize: {
      enabled: true,
      alwaysPreserveAspectRatio: true,
      minWidth: 80,
      minHeight: 80,
    },
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];
