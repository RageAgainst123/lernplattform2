'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moduleContentSchema, type Block } from '@/lib/schemas/blocks';
import { createModule, updateModule } from '@/lib/db/module-actions';
import { ACTIVITY_INFO } from '@/lib/activities';
import { type ModuleMetadata } from './ModuleMetadataForm';
import { ContentPanel, EditorHeader, MetadataPanel, type EditorTab } from './ModuleEditorPanels';

// Aktivitäts-bewusster Editor mit Tab-Layout (Phase F).
//
// Vorher 3 gleich breite Spalten — Vorschau leer = Platzverschwendung, Header
// drängelten in mehrere Zeilen. Jetzt:
//   - Sticky Header oben mit Save-Button (immer erreichbar beim Scrollen)
//   - 2-Spalten-Hauptbereich: Metadaten (~35%) | Inhalt mit Tabs „Blöcke ↔ Vorschau" (~65%)
//   - mehr vertikales Spacing, klarere Sektion-Trennung
//
// Aktivitäts-Unterschiede (lernmodul vs praesentation):
//   - Header-Titel + Subtitel
//   - AddBlockDialog filtert auf passende Block-Typen (siehe lib/activities.ts)
//   - Routing nach „Speichern": zur passenden Aktivitäts-Liste
//   - ModuleMetadataForm zeigt das Display-Mode-Select nur für Lernmodule

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
  const [tab, setTab] = useState<EditorTab>('blocks');
  const [pending, startTransition] = useTransition();

  const info = ACTIVITY_INFO[meta.activityKind];
  const headerLabel = moduleId
    ? `${info.label} bearbeiten`
    : `${info.label.endsWith('e') ? 'Neue' : 'Neues'} ${info.label}`;

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
      <EditorHeader
        label={headerLabel}
        emoji={info.iconEmoji}
        pending={pending}
        onSave={handleSave}
      />
      {error && (
        <div role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,_1fr)_minmax(0,_1.8fr)]">
        <MetadataPanel meta={meta} setMeta={setMeta} />
        <ContentPanel
          tab={tab}
          setTab={setTab}
          blocks={blocks}
          setBlocks={setBlocks}
          activityKind={meta.activityKind}
        />
      </div>
    </div>
  );
}

// Re-export für Pages
export type { ModuleMetadata };
