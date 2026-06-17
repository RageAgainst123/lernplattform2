import 'server-only';
import type { ActivityKind, DisplayMode, Kompetenzbereich } from '@/lib/schemas/entities';

// Phase V interne Typen + Pure Helpers für lib/db/class-topics.ts.
// Ausgelagert zur Einhaltung von eslint max-lines/max-lines-per-function.
// Diese Datei enthält KEINE DB-Calls — nur Typen + reine Transformations-
// Funktionen, die in Tests direkt aufrufbar sind.

export type TopicModuleEntry = {
  moduleId: string;
  title: string;
  activityKind: ActivityKind;
  displayMode: DisplayMode;
  dueDate: string | null;
  passThreshold: number | null;
  sortOrder: number;
};

export type AssignedTopicForTeacher = {
  topicId: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sortOrder: number;
  source: 'topic' | 'modules_legacy';
  modulesByKind: Record<ActivityKind, TopicModuleEntry[]>;
};

export type ClassTopicRow = {
  topic_id: string;
  due_date: string | null;
};

export type ClassModuleOverrideRow = {
  module_id: string;
  due_date: string | null;
  pass_threshold: number | null;
  modules: {
    title: string;
    topic_id: string | null;
    activity_kind: ActivityKind;
    display_mode: DisplayMode | null;
    sort_order: number;
    is_published: boolean;
  } | null;
};

export type ModuleRow = {
  id: string;
  title: string;
  topic_id: string | null;
  activity_kind: ActivityKind;
  display_mode: DisplayMode | null;
  sort_order: number;
  is_published: boolean;
};

export type TopicRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sort_order: number;
};

export type OverrideMap = Map<string, { due_date: string | null; pass_threshold: number | null }>;

const EMPTY_BY_KIND = (): Record<ActivityKind, TopicModuleEntry[]> => ({
  lernmodul: [],
  praesentation: [],
  quiz: [],
  abschlusstest: [],
});

export function moduleToEntry(
  m: ModuleRow,
  override: { due_date: string | null; pass_threshold: number | null } | undefined
): TopicModuleEntry {
  return {
    moduleId: m.id,
    title: m.title,
    activityKind: m.activity_kind,
    displayMode: m.display_mode ?? 'quiz',
    dueDate: override?.due_date ?? null,
    passThreshold: override?.pass_threshold ?? null,
    sortOrder: m.sort_order,
  };
}

export function buildTopic(
  t: TopicRow,
  modules: ModuleRow[],
  overrideByModule: OverrideMap,
  source: 'topic' | 'modules_legacy'
): AssignedTopicForTeacher {
  const grouped = EMPTY_BY_KIND();
  for (const m of modules) {
    grouped[m.activity_kind].push(moduleToEntry(m, overrideByModule.get(m.id)));
  }
  for (const kind of Object.keys(grouped) as ActivityKind[]) {
    grouped[kind].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'de'));
  }
  return {
    topicId: t.id,
    slug: t.slug,
    label: t.label,
    description: t.description,
    schulstufe: t.schulstufe,
    kompetenzbereich: t.kompetenzbereich,
    sortOrder: t.sort_order,
    source,
    modulesByKind: grouped,
  };
}

export function sortTopics(topics: AssignedTopicForTeacher[]): AssignedTopicForTeacher[] {
  return topics.sort((a, b) => {
    const stA = a.schulstufe ?? 99;
    const stB = b.schulstufe ?? 99;
    if (stA !== stB) return stA - stB;
    return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'de');
  });
}

// Entscheidet pro override-row ob es Orphan oder Legacy-Marker ist.
export function classifyOverrideRow(
  r: ClassModuleOverrideRow,
  phaseVTopicIds: Set<string>,
  orphans: TopicModuleEntry[],
  legacyTopicIds: Set<string>
): void {
  if (!r.modules) return;
  if (r.modules.topic_id) {
    if (!phaseVTopicIds.has(r.modules.topic_id)) {
      legacyTopicIds.add(r.modules.topic_id);
    }
    return;
  }
  orphans.push({
    moduleId: r.module_id,
    title: r.modules.title,
    activityKind: r.modules.activity_kind,
    displayMode: r.modules.display_mode ?? 'quiz',
    dueDate: r.due_date,
    passThreshold: r.pass_threshold,
    sortOrder: r.modules.sort_order,
  });
}

// Entscheidet ob ein Modul-Row in die Topic-Karte einfließen darf.
export function shouldIncludeModuleRow(
  m: ModuleRow,
  phaseVTopicIds: Set<string>,
  legacyTopicIds: Set<string>,
  phaseVAssignedModuleIds: Set<string>
): boolean {
  if (!m.topic_id) return false;
  if (phaseVTopicIds.has(m.topic_id)) return m.is_published;
  if (legacyTopicIds.has(m.topic_id)) return phaseVAssignedModuleIds.has(m.id);
  return false;
}
