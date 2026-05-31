'use client';

import { useState } from 'react';
import type { Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import {
  BLOCK_CATALOG,
  type BlockCatalogEntry,
  createDefaultBlock,
} from '@/components/admin/block-catalog';

// Dialog zum Hinzufügen eines Blocks aus einer kuratierten Galerie. Drei Gruppen
// (Theorie/Folie · Worksheet-Aufgabe · Live-Interaktion) mit Kurzbeschreibung pro
// Typ — Geo muss nicht mehr die MODUL-SPEZIFIKATION daneben offen haben um zu
// wissen welcher Block was tut. Klick legt einen Default-Stub an (alle
// Pflichtfelder ausgefüllt, Zod-konform), den Geo dann im JSON-Editor füllt.

export function AddBlockDialog({
  onAdd,
  existingIds,
}: {
  onAdd: (block: Block) => void;
  existingIds: string[];
}) {
  const [open, setOpen] = useState(false);

  function handlePick(entry: BlockCatalogEntry) {
    const block = createDefaultBlock(entry.type, existingIds);
    onAdd(block);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        + Block hinzufügen
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Block hinzufügen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="bg-background relative w-full max-w-3xl rounded-xl border p-4 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Block hinzufügen</h3>
            <p className="text-muted-foreground text-sm">
              Wähle einen Typ — ein Standard-Block wird unten in der Liste angelegt, den du dann im
              JSON-Editor füllst.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            ✕
          </Button>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto">
          <Group title="Theorie & Folien" entries={BLOCK_CATALOG.theory} onPick={handlePick} />
          <Group title="Worksheet-Aufgaben" entries={BLOCK_CATALOG.worksheet} onPick={handlePick} />
          <Group
            title="Live-Interaktionen (Beamer)"
            entries={BLOCK_CATALOG.live}
            onPick={handlePick}
          />
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  entries,
  onPick,
}: {
  title: string;
  entries: readonly BlockCatalogEntry[];
  onPick: (entry: BlockCatalogEntry) => void;
}) {
  return (
    <section>
      <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h4>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.type}>
            <button
              type="button"
              onClick={() => onPick(entry)}
              className="hover:bg-muted/50 focus-visible:ring-ring w-full rounded-md border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{entry.label}</span>
                <span className="text-muted-foreground font-mono text-xs">{entry.type}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{entry.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
