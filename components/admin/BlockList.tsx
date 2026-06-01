'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import { blockSchema } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { BlockForm, hasForm } from './forms/BlockForm';

// Block-Liste mit Tab-Layout pro Block (Phase D-editor.1):
//   - „Formular" — typ-spezifisches Form (MultipleChoice, TrueFalse, …)
//   - „JSON" — Roh-JSON als Power-User-Fallback und für Block-Typen ohne Form
//
// Block-Typen ohne dediziertes Form (z.B. live_poll, slide) zeigen direkt
// JSON ohne Tabs.

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

type CardMode = 'form' | 'json';

function CardHeader({
  type,
  mode,
  setMode,
  showTabs,
  index,
  total,
  onMove,
  onDelete,
}: {
  type: string;
  mode: CardMode;
  setMode: (m: CardMode) => void;
  showTabs: boolean;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs">{type}</span>
        {showTabs && (
          <div className="flex rounded-md border p-0.5 text-xs">
            <ModeTab active={mode === 'form'} onClick={() => setMode('form')}>
              Formular
            </ModeTab>
            <ModeTab active={mode === 'json'} onClick={() => setMode('json')}>
              JSON
            </ModeTab>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0}>
          ↑
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onMove(1)} disabled={index === total - 1}>
          ↓
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Block löschen">
          ✕
        </Button>
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-0.5 transition ${
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

// JSON-Editor-Tab. Hat eigenen Text-State weil Live-Validierung beim
// Tippen zu vielen Re-Renders führen würde und der User mid-typing temporär
// ungültiges JSON haben darf. Bei jedem Edit wird versucht zu parsen —
// nur bei Erfolg wird der Block weitergereicht.
function JsonEditor({ block, onChange }: { block: Block; onChange: (next: Block) => void }) {
  const [text, setText] = useState(() => JSON.stringify(block, null, 2));
  const [error, setError] = useState<string | null>(null);
  function tryUpdate(next: string) {
    setText(next);
    try {
      const parsed = blockSchema.parse(JSON.parse(next));
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Ungültiges JSON');
    }
  }
  return (
    <>
      <textarea
        value={text}
        onChange={(e) => tryUpdate(e.target.value)}
        rows={Math.min(14, Math.max(4, text.split('\n').length))}
        className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs"
        spellCheck={false}
      />
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </>
  );
}

function BlockCard({
  block,
  index,
  total,
  onMove,
  onDelete,
  onUpdate,
}: {
  block: Block;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpdate: (block: Block) => void;
}) {
  const showTabs = hasForm(block.type);
  // Default: Form für unterstützte Typen, sonst JSON. Tab-Wechsel hängt am
  // Block-Typ — wenn der sich ändert (sollte selten passieren) wird der
  // State automatisch zurückgesetzt durch das key={block.id+type}-Pattern
  // im Eltern-Component.
  const [mode, setMode] = useState<CardMode>(showTabs ? 'form' : 'json');
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <CardHeader
        type={block.type}
        mode={mode}
        setMode={setMode}
        showTabs={showTabs}
        index={index}
        total={total}
        onMove={onMove}
        onDelete={onDelete}
      />
      {mode === 'form' && showTabs ? (
        <BlockForm block={block} onChange={onUpdate} />
      ) : (
        <JsonEditor block={block} onChange={onUpdate} />
      )}
    </div>
  );
}

export function BlockList({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Noch keine Blöcke. Importiere JSON oder füge unten welche hinzu.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id + ':' + i}
          block={b}
          index={i}
          total={blocks.length}
          onMove={(dir) => onChange(moveItem(blocks, i, i + dir))}
          onDelete={() => onChange(blocks.filter((_, j) => j !== i))}
          onUpdate={(next) => onChange(blocks.map((bb, j) => (j === i ? next : bb)))}
        />
      ))}
    </div>
  );
}
