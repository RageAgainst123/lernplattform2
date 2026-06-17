'use client';

import { Button } from '@/components/ui/button';

// Gemeinsame UI-Bausteine für Block-Forms. Klein gehalten — kein
// State-Management, nur Layout-Helper damit jeder Form-Typ konsistent aussieht.

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium">
      {children}
    </label>
  );
}

// Einzeiliger Text-Input
export function TextInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
    />
  );
}

// Mehrzeiliger Textarea-Input
export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 3}
      className="border-input bg-background w-full rounded-md border p-2 text-sm"
    />
  );
}

// Kleine Add-Item-Button mit Plus-Icon-Look
export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick}>
      + {children}
    </Button>
  );
}

// Kleine Liste-Item-Aktion (löschen, hoch/runter). Inline neben Inhalten.
export function ItemAction({
  onClick,
  label,
  disabled,
  tone,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  tone?: 'default' | 'destructive';
}) {
  const toneClass =
    tone === 'destructive'
      ? 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'
      : 'hover:bg-muted text-muted-foreground';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${toneClass} rounded px-1.5 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
      aria-label={label}
      title={label}
    >
      {label}
    </button>
  );
}

// Stabile ID-Generierung für neue Optionen — kein Math.random im React-Tree,
// stattdessen ein zähler-basierter Suffix mit Präfix-Hint.
export function makeOptionId(existing: { id: string }[], prefix = 'o'): string {
  let n = existing.length + 1;
  const taken = new Set(existing.map((e) => e.id));
  while (taken.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}
