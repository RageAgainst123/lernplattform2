import 'server-only';
import type { ActivityKind, Kompetenzbereich } from '@/lib/schemas/entities';
import { type ModuleStatus, type ProgressInfo } from './student-modules-status';
import { aggregateTopicStatus, type TopicStatus } from './student-topics-status';

// Phase V interne Typen + Pure Helpers für lib/db/student-topics.ts.
// Ausgelagert für eslint max-lines/max-lines-per-function. Keine DB-Calls.

export type StudentTopicModule = {
  moduleId: string;
  title: string;
  activityKind: ActivityKind;
  sortOrder: number;
  status: ModuleStatus;
  percent: number | null;
};

export type StudentTopic = {
  topicId: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sortOrder: number;
  status: TopicStatus;
  total: number;
  done: number;
  inProgress: number;
  modules: StudentTopicModule[];
};

export type StudentTopicModuleStub = {
  moduleId: string;
  title: string;
  activityKind: ActivityKind;
  sortOrder: number;
  topicId: string;
};

export type ClassModuleJoinRow = {
  module_id: string;
  modules: {
    title: string;
    is_published: boolean;
    topic_id: string | null;
    activity_kind: ActivityKind;
    sort_order: number;
  } | null;
};

export type StudentModuleRow = {
  id: string;
  title: string;
  is_published: boolean;
  topic_id: string | null;
  activity_kind: ActivityKind;
  sort_order: number;
};

export type StudentTopicRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sort_order: number;
};

// Module die für Schüler:innen relevant sind (alles außer Präsentation).
export function isStudentRelevant(kind: ActivityKind): boolean {
  return kind !== 'praesentation';
}

// Stub aus einer modules-Zeile bauen.
export function stubFromModuleRow(m: StudentModuleRow): StudentTopicModuleStub | null {
  if (!m.topic_id) return null;
  if (!isStudentRelevant(m.activity_kind)) return null;
  return {
    moduleId: m.id,
    title: m.title,
    activityKind: m.activity_kind,
    sortOrder: m.sort_order,
    topicId: m.topic_id,
  };
}

// Stub aus einer class_modules-Join-Zeile bauen (für Legacy-Fallback).
export function stubFromClassModuleRow(r: ClassModuleJoinRow): StudentTopicModuleStub | null {
  if (!r.modules || !r.modules.is_published || !r.modules.topic_id) return null;
  if (!isStudentRelevant(r.modules.activity_kind)) return null;
  return {
    moduleId: r.module_id,
    title: r.modules.title,
    activityKind: r.modules.activity_kind,
    sortOrder: r.modules.sort_order,
    topicId: r.modules.topic_id,
  };
}

// Topic-Karte für eine Schüler:in fertig montieren.
export function buildStudentTopic(
  t: StudentTopicRow,
  stubs: StudentTopicModuleStub[],
  progressByModule: Map<string, ProgressInfo>
): StudentTopic {
  const modules: StudentTopicModule[] = stubs
    .map((s) => {
      const info = progressByModule.get(s.moduleId);
      return {
        moduleId: s.moduleId,
        title: s.title,
        activityKind: s.activityKind,
        sortOrder: s.sortOrder,
        status: info?.status ?? 'open',
        percent: info?.percent ?? null,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'de'));
  const agg = aggregateTopicStatus(modules.map((m) => m.status));
  return {
    topicId: t.id,
    slug: t.slug,
    label: t.label,
    description: t.description,
    schulstufe: t.schulstufe,
    kompetenzbereich: t.kompetenzbereich,
    sortOrder: t.sort_order,
    status: agg.status,
    total: agg.total,
    done: agg.done,
    inProgress: agg.inProgress,
    modules,
  };
}

// Sortier-Reihenfolge auf dem Schüler-Dashboard: in_progress → open → done.
const TOPIC_PRIORITY: Record<TopicStatus, number> = { in_progress: 0, open: 1, done: 2 };

export function sortStudentTopics(topics: StudentTopic[]): StudentTopic[] {
  return topics.sort((a, b) => {
    const p = TOPIC_PRIORITY[a.status] - TOPIC_PRIORITY[b.status];
    if (p !== 0) return p;
    const stA = a.schulstufe ?? 99;
    const stB = b.schulstufe ?? 99;
    if (stA !== stB) return stA - stB;
    return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'de');
  });
}

// Stub in die Topic-Map einfügen, mit Dedup-Check.
export function addStubIfNew(
  modulesByTopic: Map<string, StudentTopicModuleStub[]>,
  seenModuleIds: Set<string>,
  stub: StudentTopicModuleStub
): void {
  if (seenModuleIds.has(stub.moduleId)) return;
  seenModuleIds.add(stub.moduleId);
  const list = modulesByTopic.get(stub.topicId) ?? [];
  list.push(stub);
  modulesByTopic.set(stub.topicId, list);
}
