'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moduleContentSchema, type Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { createModule, updateModule } from '@/lib/db/module-actions';
import { ModuleMetadataForm, type ModuleMetadata } from './ModuleMetadataForm';
import { BlockList } from './BlockList';
import { ImportJsonDialog } from './ImportJsonDialog';
import { LivePreview } from './LivePreview';

// Modul-Editor mit drei Spalten auf Desktop: Metadaten | Blöcke (+Import) | Vorschau.
// Auf Mobile gestapelt. Keine eigene State-Library — useState + Server-Actions reichen.

type Props = {
  moduleId?: string;
  initialMeta: ModuleMetadata;
  initialBlocks: Block[];
};

export function ModuleEditor({ moduleId, initialMeta, initialBlocks }: Props) {
  const router = useRouter();
  const [meta, setMeta] = useState<ModuleMetadata>(initialMeta);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const contentParsed = moduleContentSchema.safeParse({ blocks });
    if (!contentParsed.success) {
      setError(
        'Block-Inhalt ungültig: ' + contentParsed.error.issues.map((i) => i.message).join('; ')
      );
      return;
    }
    const payload = {
      title: meta.title,
      description: meta.description || undefined,
      schulstufe: meta.schulstufe ?? undefined,
      kompetenzbereich: meta.kompetenzbereich ?? undefined,
      topic: meta.topic || undefined,
      content: contentParsed.data,
      estimatedMinutes: meta.estimatedMinutes ?? undefined,
      isPublished: meta.isPublished,
      displayMode: meta.displayMode,
    };
    startTransition(async () => {
      try {
        if (moduleId) {
          await updateModule(moduleId, payload);
        } else {
          const { id } = await createModule(payload);
          router.push(`/admin/module/${id}`);
          return;
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {moduleId ? 'Modul bearbeiten' : 'Neues Modul'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Tippe Metadaten und Blöcke. Live-Vorschau zeigt, wie Schüler:innen es sehen.
          </p>
        </div>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? 'Speichere…' : 'Speichern'}
        </Button>
      </header>

      {error && (
        <div role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <section aria-labelledby="meta-h">
          <h2 id="meta-h" className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Metadaten
          </h2>
          <ModuleMetadataForm value={meta} onChange={setMeta} />
        </section>

        <section aria-labelledby="blocks-h" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="blocks-h" className="text-sm font-semibold tracking-wide uppercase">
              Blöcke ({blocks.length})
            </h2>
            <ImportJsonDialog
              onImport={(imported, mode) => {
                setBlocks((prev) => (mode === 'replace' ? imported : [...prev, ...imported]));
              }}
            />
          </div>
          <BlockList blocks={blocks} onChange={setBlocks} />
        </section>

        <section aria-labelledby="preview-h">
          <h2 id="preview-h" className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Vorschau
          </h2>
          <LivePreview blocks={blocks} />
        </section>
      </div>
    </div>
  );
}

// Re-export für Pages
export type { ModuleMetadata };
