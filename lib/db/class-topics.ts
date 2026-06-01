import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { ActivityKind, DisplayMode, Kompetenzbereich } from '@/lib/schemas/entities';

// Lese-Funktionen für die Themen-Sicht einer Klasse (Phase G3). Aggregiert
// zugewiesene Module pro Thema — damit die Lehrer:in pro Klasse Themen-Karten
// statt einer flachen Modul-Liste sehen kann.
//
// Datenfluss: class_modules.module_id → modules.topic_id → topics.id.
// Wir laden alle zugewiesenen Module via RLS-geschütztem User-Client, dann
// laden wir die zugehörigen Topics via Service-Role (RLS auf topics erlaubt
// SELECT für alle — aber via Service-Role ist konsistent mit der Admin-Lese-
// strategie und wir brauchen Topic-Metadaten auch wenn unpubliziert).

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
  // Module pro Aktivitäts-Typ, jeweils nach sort_order sortiert
  modulesByKind: Record<ActivityKind, TopicModuleEntry[]>;
};

type ClassModuleJoinRow = {
  module_id: string;
  due_date: string | null;
  pass_threshold: number | null;
  modules: {
    title: string;
    topic_id: string | null;
    activity_kind: ActivityKind;
    display_mode: DisplayMode | null;
    sort_order: number;
  } | null;
};

type TopicRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sort_order: number;
};

const EMPTY_BY_KIND = (): Record<ActivityKind, TopicModuleEntry[]> => ({
  lernmodul: [],
  praesentation: [],
  quiz: [],
  abschlusstest: [],
});

// Eine Modul-Zuweisungs-Zeile in einen TopicModuleEntry verwandeln.
function rowToEntry(r: ClassModuleJoinRow): TopicModuleEntry | null {
  if (!r.modules) return null;
  return {
    moduleId: r.module_id,
    title: r.modules.title,
    activityKind: r.modules.activity_kind,
    displayMode: r.modules.display_mode ?? 'quiz',
    dueDate: r.due_date,
    passThreshold: r.pass_threshold,
    sortOrder: r.modules.sort_order,
  };
}

// Module nach topic_id gruppieren. Orphans (ohne topic) in separate Liste.
function groupRowsByTopic(rows: ClassModuleJoinRow[]): {
  byTopic: Map<string, TopicModuleEntry[]>;
  orphans: TopicModuleEntry[];
} {
  const byTopic = new Map<string, TopicModuleEntry[]>();
  const orphans: TopicModuleEntry[] = [];
  for (const r of rows) {
    const entry = rowToEntry(r);
    if (!entry || !r.modules) continue;
    if (r.modules.topic_id) {
      const list = byTopic.get(r.modules.topic_id) ?? [];
      list.push(entry);
      byTopic.set(r.modules.topic_id, list);
    } else {
      orphans.push(entry);
    }
  }
  return { byTopic, orphans };
}

// Eine Topic-Zeile + ihre zugewiesenen Module zu einer fertigen
// AssignedTopicForTeacher zusammensetzen (gruppiert + sortiert pro Aktivität).
function buildTopic(t: TopicRow, modules: TopicModuleEntry[] | undefined): AssignedTopicForTeacher {
  const grouped = EMPTY_BY_KIND();
  for (const m of modules ?? []) {
    grouped[m.activityKind].push(m);
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
    modulesByKind: grouped,
  };
}

function sortTopics(topics: AssignedTopicForTeacher[]): AssignedTopicForTeacher[] {
  return topics.sort((a, b) => {
    const stA = a.schulstufe ?? 99;
    const stB = b.schulstufe ?? 99;
    if (stA !== stB) return stA - stB;
    return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'de');
  });
}

// Liefert pro Klasse die Themen mit ihren zugewiesenen Modulen gruppiert
// nach Aktivität. Module ohne topic_id werden in einem speziellen Sammler
// zurückgegeben (für die „Sonstiges"-Sektion in der Lehrer-UI).
export async function getAssignedTopicsForClass(
  classId: string
): Promise<{ topics: AssignedTopicForTeacher[]; orphanModules: TopicModuleEntry[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('class_modules')
    .select(
      'module_id, due_date, pass_threshold, modules(title, topic_id, activity_kind, display_mode, sort_order)'
    )
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Zugewiesene Themen konnten nicht geladen werden: ${error.message}`);
  }
  const { byTopic, orphans } = groupRowsByTopic((data ?? []) as unknown as ClassModuleJoinRow[]);

  const topicIds = Array.from(byTopic.keys());
  if (topicIds.length === 0) {
    return { topics: [], orphanModules: orphans };
  }
  // Topic-Metadaten via Service-Role nachladen — auch unveröffentlichte
  // Themen sollen sichtbar sein, falls der Admin sie nachträglich verbirgt.
  const svc = createServiceClient();
  const { data: topicData, error: topicError } = await svc
    .from('topics')
    .select('id, slug, label, description, schulstufe, kompetenzbereich, sort_order')
    .in('id', topicIds);
  if (topicError) {
    throw new Error(`Themen-Metadaten konnten nicht geladen werden: ${topicError.message}`);
  }
  const topicRows = (topicData ?? []) as TopicRow[];
  const topics = sortTopics(topicRows.map((t) => buildTopic(t, byTopic.get(t.id))));
  return { topics, orphanModules: orphans };
}

// Alle veröffentlichten Themen für das Themen-Zuweisungs-Dropdown der
// Lehrer:in. Nur Stufe + Label nötig für die Anzeige.
export type PublishedTopicOption = {
  id: string;
  label: string;
  schulstufe: number | null;
};

export async function getPublishedTopicsAll(): Promise<PublishedTopicOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, label, schulstufe')
    .eq('is_published', true)
    .order('schulstufe', { ascending: true, nullsFirst: false })
    .order('label', { ascending: true });
  if (error) {
    throw new Error(`Themen-Liste konnte nicht geladen werden: ${error.message}`);
  }
  return (data as PublishedTopicOption[]) ?? [];
}
