'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ToolbarButton } from './NotebookToolbarParts';

// Tabellen-Dropdown: drei häufigste Operationen + Untermenü für mehr.
// Bewusst kein Modal mit Rows/Cols-Picker — für 10-14-Jährige overkill.
// Ausgelagert aus NotebookToolbarParts.tsx um max-lines einzuhalten.

export function TableButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <ToolbarButton active={open} onClick={() => setOpen(!open)} label="Tabelle">
        ⊞
      </ToolbarButton>
      {open && <TableMenu editor={editor} onClose={() => setOpen(false)} />}
    </div>
  );
}

function TableMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const inTable = editor.isActive('table');
  return (
    <div className="bg-background absolute top-10 left-0 z-20 flex w-44 flex-col gap-0.5 rounded-md border p-1 text-sm shadow-md">
      <TableMenuItem
        onClick={() => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          onClose();
        }}
      >
        Neue Tabelle (3×3)
      </TableMenuItem>
      <hr className="my-1" />
      <TableMenuItem disabled={!inTable} onClick={() => editor.chain().focus().addRowAfter().run()}>
        Zeile hinzufügen
      </TableMenuItem>
      <TableMenuItem
        disabled={!inTable}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        Spalte hinzufügen
      </TableMenuItem>
      <TableMenuItem disabled={!inTable} onClick={() => editor.chain().focus().deleteRow().run()}>
        Zeile löschen
      </TableMenuItem>
      <TableMenuItem
        disabled={!inTable}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        Spalte löschen
      </TableMenuItem>
      <hr className="my-1" />
      <TableMenuItem
        disabled={!inTable}
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
      >
        Tabelle löschen
      </TableMenuItem>
    </div>
  );
}

function TableMenuItem({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hover:bg-muted rounded px-2 py-1 text-left disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
