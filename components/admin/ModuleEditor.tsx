'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moduleContentStrictSchema, type Block } from '@/lib/schemas/blocks';
import { publishGateIssues } from '@/lib/schemas/blocks-refine';
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
  // V5: Anzahl Schüler:innen mit Fortschritt in diesem Modul. > 0 → amber
  // Warn-Banner (nur Hinweis, blockiert nichts) — inhaltliche Änderungen
  // können gespeicherte Antworten/Scores inkonsistent machen.
  progressCount?: number;
};

export function ModuleEditor({ moduleId, initialMeta, initialBlocks, progressCount }: Props) {
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
    const contentParsed = moduleContentStrictSchema.safeParse({ blocks });
    if (!contentParsed.success) {
      setError(
        'Block-Inhalt ungültig: ' + contentParsed.error.issues.map((i) => i.message).join('; ')
      );
      return;
    }
    // Publish-Gate: Entwurf-legitime Lücken (z. B. hotspot ohne Zonen) blocken
    // nur das Veröffentlichen, nicht das Speichern als Entwurf.
    if (meta.isPublished) {
      const gate = publishGateIssues(contentParsed.data.blocks);
      if (gate.length) {
        setError('Veröffentlichen nicht möglich: ' + gate.join(' '));
        return;
      }
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
      {progressCount !== undefined && progressCount > 0 && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          ⚠ {progressCount} Schüler:in{progressCount === 1 ? ' hat' : 'nen haben'} dieses Modul
          bereits begonnen oder abgeschlossen. Inhaltliche Änderungen (Blöcke löschen, Lösungen
          ändern) können gespeicherte Antworten und Bewertungen inkonsistent machen — besser das
          Modul duplizieren und die Kopie bearbeiten.
        </div>
      )}
      {error && (
        <div role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,_340px)_minmax(0,_1fr)]">
        <MetadataPanel meta={meta} setMeta={setMeta} />
        <ContentPanel
          tab={tab}
          setTab={setTab}
          blocks={blocks}
          setBlocks={setBlocks}
          activityKind={meta.activityKind}
          displayMode={meta.displayMode}
        />
      </div>
    </div>
  );
}

// Re-export für Pages
export type { ModuleMetadata };
