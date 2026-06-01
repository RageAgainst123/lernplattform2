'use client';

import type { Editor } from '@tiptap/react';
import {
  ColorPicker,
  Divider,
  LinkButton,
  TableButton,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSelect,
} from './NotebookToolbarParts';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
  alignSpecs,
  blockSpecs,
  currentFontFamily,
  currentFontSize,
  formatSpecs,
  historySpecs,
} from './notebook-toolbar-config';

// Word-Ribbon-Toolbar (Phase H+ Vollausbau). Gruppen:
//   - Schrift: FontFamily-Select, FontSize-Select
//   - Format: B, I, U, S
//   - Block: H1/H2, Aufzählung, Nummerierung
//   - Color: Textfarbe + Markierungsfarbe (Pop-Picker)
//   - Align: Links / Mitte / Rechts
//   - Insert: Link, Bild, Tabelle
//   - History: Undo / Redo

export function NotebookToolbar({
  editor,
  onPickImage,
}: {
  editor: Editor | null;
  onPickImage?: () => void;
}) {
  if (!editor) return null;
  return (
    <div className="bg-muted/40 sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-md border p-1.5 shadow-sm">
      <FontControls editor={editor} />
      <Divider />
      <ToolbarGroup specs={formatSpecs(editor)} />
      <Divider />
      <ToolbarGroup specs={blockSpecs(editor)} />
      <Divider />
      <ColorControls editor={editor} />
      <Divider />
      <ToolbarGroup specs={alignSpecs(editor)} />
      <Divider />
      <InsertControls editor={editor} onPickImage={onPickImage} />
      <Divider />
      <ToolbarGroup specs={historySpecs(editor)} />
    </div>
  );
}

function FontControls({ editor }: { editor: Editor }) {
  return (
    <>
      <ToolbarSelect
        value={currentFontFamily(editor)}
        options={FONT_FAMILIES}
        label="Schriftart"
        width="w-32"
        onChange={(v) => {
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
      />
      <ToolbarSelect
        value={currentFontSize(editor)}
        options={FONT_SIZES}
        label="Schriftgröße"
        width="w-20"
        onChange={(v) => {
          if (v) editor.chain().focus().setFontSize(v).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
      />
    </>
  );
}

function ColorControls({ editor }: { editor: Editor }) {
  return (
    <>
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
    </>
  );
}

function InsertControls({ editor, onPickImage }: { editor: Editor; onPickImage?: () => void }) {
  return (
    <>
      <LinkButton editor={editor} />
      {onPickImage && (
        <ToolbarButton active={false} onClick={onPickImage} label="Bild einfügen">
          📷
        </ToolbarButton>
      )}
      <TableButton editor={editor} />
    </>
  );
}
