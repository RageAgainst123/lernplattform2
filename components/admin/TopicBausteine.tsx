'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ActivityKind, Module } from '@/lib/schemas/entities';
import { ACTIVITY_INFO } from '@/lib/activities';
import { setModuleTopic, setTopicModuleOrder } from '@/lib/db/topic-actions';
import { Button } from '@/components/ui/button';
import type { ModuleOptionWithSource } from '@/lib/db/modules';

// Bausteine-Sektion im Themen-Editor (Phase G). Zeigt pro Aktivitäts-Typ
// (Präsentation, Lernmodul, Quiz, Abschlusstest) eine sortierbare Liste der
// zugeordneten Module + ein „+ Hinzufügen"-Dropdown.
//
// Das Dropdown enthält auch Module die schon einem ANDEREN Thema zugeordnet
// sind — beim Hinzufügen werden sie umgehängt. Visueller Hinweis im Label:
// „… (aktuell in Thema X)". Wichtig nach der Migration 0013, wo alle Module
// automatisch einem Bestand-Thema zugeordnet wurden.
//
// Sortierung via ↑↓-Buttons statt DnD — kommt mit max-lines-Limit hin und
// reicht für 5-10 Bausteine pro Thema. Persistenz nach jedem Move via
// setTopicModuleOrder (Optimistic UI: lokal updaten, dann Server-Action).

type Props = {
  topicId: string;
  modulesByKind: Record<ActivityKind, Module[]>;
  availableByKind: Record<ActivityKind, ModuleOptionWithSource[]>;
};

const KIND_ORDER: ActivityKind[] = ['praesentation', 'lernmodul', 'quiz', 'abschlusstest'];

export function TopicBausteine({ topicId, modulesByKind, availableByKind }: Props) {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Bausteine im Lernpfad</h2>
        <p className="text-muted-foreground text-sm">
          Schüler:innen sehen Lernmodule + Quiz + Abschlusstest in dieser Reihenfolge.
          Präsentationen sind nur für die Lehrer:in (Stundeneinstieg am Beamer).
        </p>
      </header>
      {KIND_ORDER.map((kind) => (
        <KindSection
          key={kind}
          topicId={topicId}
          kind={kind}
          modules={modulesByKind[kind] ?? []}
          available={availableByKind[kind] ?? []}
        />
      ))}
    </section>
  );
}

function KindSection({
  topicId,
  kind,
  modules,
  available,
}: {
  topicId: string;
  kind: ActivityKind;
  modules: Module[];
  available: ModuleOptionWithSource[];
}) {
  const info = ACTIVITY_INFO[kind];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState('');

  function move(idx: number, delta: number) {
    const next = [...modules];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    const ordering = next.map((m, i) => ({ moduleId: m.id, sortOrder: i }));
    startTransition(async () => {
      await setTopicModuleOrder(topicId, ordering);
      router.refresh();
    });
  }

  function add() {
    if (!selectedId) return;
    const id = selectedId;
    setSelectedId('');
    startTransition(async () => {
      await setModuleTopic(id, topicId);
      router.refresh();
    });
  }

  function remove(moduleId: string) {
    startTransition(async () => {
      await setModuleTopic(moduleId, null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden>{info.iconEmoji}</span>
        {info.plural}
        <span className="text-muted-foreground text-xs font-normal">({modules.length})</span>
      </h3>
      {modules.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
          Noch kein {info.label} zugeordnet.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {modules.map((m, i) => (
            <li key={m.id} className="flex items-center gap-2 px-3 py-2">
              <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">
                {i + 1}.
              </span>
              <Link
                href={`/admin/${info.urlSegment}/${m.id}`}
                className="flex-1 truncate text-sm hover:underline"
              >
                {m.title}
              </Link>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={pending || i === 0}
                  className="hover:bg-muted disabled:text-muted-foreground/50 rounded px-1.5 py-0.5 text-xs disabled:cursor-not-allowed"
                  aria-label="Nach oben"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={pending || i === modules.length - 1}
                  className="hover:bg-muted disabled:text-muted-foreground/50 rounded px-1.5 py-0.5 text-xs disabled:cursor-not-allowed"
                  aria-label="Nach unten"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  disabled={pending}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded px-1.5 py-0.5 text-xs"
                  aria-label="Aus Thema entfernen"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={pending}
            className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
          >
            <option value="">— {info.label} hinzufügen —</option>
            {available.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
                {o.currentTopicLabel ? ` (aktuell in: ${o.currentTopicLabel})` : ''}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={add} disabled={pending || !selectedId}>
            Hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}
