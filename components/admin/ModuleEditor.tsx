'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moduleContentSchema, type Block } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { createModule, updateModule } from '@/lib/db/module-actions';
import { ACTIVITY_INFO } from '@/lib/activities';
import { ModuleMetadataForm, type ModuleMetadata } from './ModuleMetadataForm';
import { BlockList } from './BlockList';
import { ImportJsonDialog } from './ImportJsonDialog';
import { AddBlockDialog } from './AddBlockDialog';
import { LivePreview } from './LivePreview';

// Aktivitäts-bewusster Editor — der gleiche Code dient Lernmodulen UND
// Präsentationen (kommt aus initialMeta.activityKind). Unterschiede:
//   - Header-Titel + Subtitel
//   - AddBlockDialog filtert auf passende Block-Typen (siehe lib/activities.ts)
//   - Routing nach „Speichern": zur passenden Aktivitäts-Liste
//   - ModuleMetadataForm zeigt das Display-Mode-Select nur für Lernmodule
//
// Drei Spalten auf Desktop: Metadaten | Blöcke (+Import) | Vorschau. Auf Mobile
// gestapelt. Keine eigene State-Library — useState + Server-Actions reichen.

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

  const info = ACTIVITY_INFO[meta.activityKind];

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
      activityKind: meta.activityKind,
      displayMode: meta.displayMode,
    };
    startTransition(async () => {
      try {
        if (moduleId) {
          await updateModule(moduleId, payload);
        } else {
          const { id } = await createModule(payload);
          router.push(`/admin/${info.urlSegment}/${id}`);
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
            {moduleId
              ? `${info.label} bearbeiten`
              : `Neue${info.label.endsWith('e') ? '' : 's'} ${info.label}`}
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
          <div className="flex items-center justify-between gap-2">
            <h2 id="blocks-h" className="text-sm font-semibold tracking-wide uppercase">
              Blöcke ({blocks.length})
            </h2>
            <div className="flex items-center gap-2">
              <AddBlockDialog
                existingIds={blocks.map((b) => b.id)}
                allowedKind={meta.activityKind}
                onAdd={(block) => setBlocks((prev) => [...prev, block])}
              />
              <ImportJsonDialog
                onImport={(imported, mode) => {
                  setBlocks((prev) => (mode === 'replace' ? imported : [...prev, ...imported]));
                }}
              />
            </div>
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
