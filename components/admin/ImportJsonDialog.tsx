'use client';

import { useState } from 'react';
import { z } from 'zod';
import { blockSchema, moduleContentStrictSchema, type Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';

// JSON-Import: nimmt entweder ein Block-Array ODER ein { blocks: [...] }-Objekt.
// Validiert via Zod (inkl. fachlicher IMMER-Regeln aus blocks-refine.ts),
// gibt aussagekräftige Fehler zurück.

const importPayloadSchema = z.union([
  z.array(blockSchema),
  z.object({ blocks: z.array(blockSchema) }).transform((o) => o.blocks),
]);

function parseImport(json: string): Block[] {
  const data = JSON.parse(json);
  const blocks = importPayloadSchema.parse(data);
  const strict = moduleContentStrictSchema.safeParse({ blocks });
  if (!strict.success) {
    throw new Error(strict.error.issues.map((i) => i.message).join('; '));
  }
  return strict.data.blocks;
}

export function ImportJsonDialog({
  onImport,
}: {
  onImport: (blocks: Block[], mode: 'replace' | 'append') => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(mode: 'replace' | 'append') {
    setError(null);
    try {
      const blocks = parseImport(text);
      onImport(blocks, mode);
      setText('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Ungültiges JSON');
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        JSON importieren
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="JSON importieren"
      className="bg-background fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="bg-background relative w-full max-w-2xl rounded-xl border p-4 shadow-lg">
        <h3 className="mb-2 text-lg font-semibold">JSON importieren</h3>
        <p className="text-muted-foreground mb-3 text-sm">
          Füge ein Array von Blöcken ein, z.B. von einer KI generiert. Wird gegen das Schema
          validiert.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder='[ { "id": "1", "type": "text", "content": "..." } ]'
          className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs"
          spellCheck={false}
        />
        {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('append')}>
            Anhängen
          </Button>
          <Button onClick={() => handleSubmit('replace')}>Ersetzen</Button>
        </div>
      </div>
    </div>
  );
}
