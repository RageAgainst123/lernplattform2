'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';

// Wiederverwendbare Toolbar-Bausteine: Button, Divider, ColorPicker,
// LinkButton. In eigene Datei extrahiert damit NotebookToolbar unter
// max-lines bleibt.

export type ToolbarSpec = {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
};

export function ToolbarButton({
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

export function ToolbarGroup({ specs }: { specs: ToolbarSpec[] }) {
  return (
    <>
      {specs.map((s) => (
        <ToolbarButton key={s.label} {...s}>
          {s.icon}
        </ToolbarButton>
      ))}
    </>
  );
}

export function Divider() {
  return <div className="bg-border mx-1 h-5 w-px" />;
}

// Mini-Farbpicker: Knopf öffnet Popover mit Farbpalette. Klick auf eine
// Farbe schließt sofort + ruft onPick. Leere Farbe = aufheben.
export function ColorPicker({
  colors,
  label,
  icon,
  onPick,
}: {
  colors: { value: string; label: string }[];
  label: string;
  icon: React.ReactNode;
  onPick: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <ToolbarButton active={open} onClick={() => setOpen(!open)} label={label}>
        {icon}
      </ToolbarButton>
      {open && (
        <div className="bg-background absolute top-9 left-0 z-20 flex gap-1 rounded-md border p-1 shadow-md">
          {colors.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                onPick(c.value);
                setOpen(false);
              }}
              className="hover:ring-primary h-6 w-6 rounded border hover:ring-2"
              style={{ backgroundColor: c.value || 'transparent' }}
              aria-label={c.label}
              title={c.label}
            >
              {!c.value && <span className="text-xs">∅</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Link-Button: Prompt nach URL, dann setLink/unsetLink.
export function LinkButton({ editor }: { editor: Editor }) {
  const active = editor.isActive('link');
  function handleClick() {
    if (active) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Link-URL (z.B. https://wikipedia.org):');
    if (!url) return;
    // Sicherheit: nur https/http erlauben, kein javascript:
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().setLink({ href: safe }).run();
  }
  return (
    <ToolbarButton
      active={active}
      onClick={handleClick}
      label={active ? 'Link entfernen' : 'Link einfügen'}
    >
      🔗
    </ToolbarButton>
  );
}
