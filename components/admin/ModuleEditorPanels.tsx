'use client';

import type { Block } from '@/lib/schemas/blocks';
import type { ActivityKind } from '@/lib/schemas/entities';
import { Button } from '@/components/ui/button';
import { AddBlockDialog } from '@/components/admin/AddBlockDialog';
import { ImportJsonDialog } from '@/components/admin/ImportJsonDialog';
import { BlockList } from '@/components/admin/BlockList';
import { LivePreview } from '@/components/admin/LivePreview';
import { ModuleMetadataForm, type ModuleMetadata } from '@/components/admin/ModuleMetadataForm';

// Sub-Bausteine vom ModuleEditor (Phase F): Header, Metadaten-Panel, Tabs.
// Ausgelagert damit der Editor selbst unter dem 200-Zeilen-Limit bleibt und
// die Stage-Logik vom Layout sauber getrennt ist.

export type EditorTab = 'blocks' | 'preview';

export function EditorHeader({
  label,
  emoji,
  pending,
  onSave,
}: {
  label: string;
  emoji: string;
  pending: boolean;
  onSave: () => void;
}) {
  return (
    <header className="bg-background sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 border-b px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{label}</h1>
      </div>
      <Button onClick={onSave} disabled={pending}>
        {pending ? 'Speichere…' : 'Speichern'}
      </Button>
    </header>
  );
}

export function MetadataPanel({
  meta,
  setMeta,
}: {
  meta: ModuleMetadata;
  setMeta: (m: ModuleMetadata) => void;
}) {
  return (
    <section aria-labelledby="meta-h" className="space-y-3">
      <h2
        id="meta-h"
        className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
      >
        Metadaten
      </h2>
      <div className="bg-card rounded-lg border p-4">
        <ModuleMetadataForm value={meta} onChange={setMeta} />
      </div>
    </section>
  );
}

function TabButton({
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
      className={
        active
          ? 'border-primary text-foreground -mb-px border-b-2 px-3 py-2 text-sm font-medium'
          : 'text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium'
      }
    >
      {children}
    </button>
  );
}

export function ContentPanel({
  tab,
  setTab,
  blocks,
  setBlocks,
  activityKind,
}: {
  tab: EditorTab;
  setTab: (t: EditorTab) => void;
  blocks: Block[];
  setBlocks: (next: Block[] | ((prev: Block[]) => Block[])) => void;
  activityKind: ActivityKind;
}) {
  return (
    <section aria-labelledby="content-h" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b">
        <div className="flex gap-1">
          <TabButton active={tab === 'blocks'} onClick={() => setTab('blocks')}>
            Blöcke ({blocks.length})
          </TabButton>
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            Vorschau
          </TabButton>
        </div>
        {tab === 'blocks' && (
          <div className="mb-1.5 flex items-center gap-2">
            <AddBlockDialog
              existingIds={blocks.map((b) => b.id)}
              allowedKind={activityKind}
              onAdd={(block) => setBlocks((prev) => [...prev, block])}
            />
            <ImportJsonDialog
              onImport={(imported, mode) => {
                setBlocks((prev) => (mode === 'replace' ? imported : [...prev, ...imported]));
              }}
            />
          </div>
        )}
      </div>
      <div className="pt-2">
        {tab === 'blocks' ? (
          <BlockList blocks={blocks} onChange={setBlocks} />
        ) : (
          <LivePreview blocks={blocks} />
        )}
      </div>
    </section>
  );
}
