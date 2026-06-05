import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  buildTopic,
  classifyOverrideRow,
  shouldIncludeModuleRow,
  sortTopics,
  type AssignedTopicForTeacher,
  type ClassModuleOverrideRow,
  type ClassTopicRow,
  type ModuleRow,
  type OverrideMap,
  type TopicModuleEntry,
  type TopicRow,
} from './class-topics-internals';

// Lese-Funktionen für die Themen-Sicht einer Klasse.
//
// Phase V (2026-06): class_topics ist jetzt Source of Truth. Eine Themen-
// Zuweisung lebt in class_topics; die zugehörigen Module ergeben sich aus
// modules.topic_id. Damit erscheinen neue Module eines Topics automatisch
// in allen zugewiesenen Klassen.
//
// class_modules bleibt parallel bestehen:
//   1. Als Override für due_date/pass_threshold pro Modul.
//   2. Als Fallback für Orphans (Module ohne topic_id, einzeln zugewiesen).
//   3. Als Backward-Compat für Bestands-Zuweisungen aus pre-Phase-V.
//
// Pure Helpers + Typen leben in class-topics-internals.ts.

// Re-Exports für Konsumenten (bestehende Imports brechen sonst).
export type { AssignedTopicForTeacher, TopicModuleEntry } from './class-topics-internals';

type OverrideClassification = {
  overrideByModule: OverrideMap;
  orphans: TopicModuleEntry[];
  legacyTopicIds: Set<string>;
};

// class_topics laden → Topic-IDs der Klasse (Phase-V-Source-of-Truth).
async function loadClassTopicIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('class_topics')
    .select('topic_id, due_date')
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Zugewiesene Themen konnten nicht geladen werden: ${error.message}`);
  }
  return new Set(((data ?? []) as ClassTopicRow[]).map((r) => r.topic_id));
}

// class_modules → Override-Map + Orphans + Legacy-Topic-Marker.
async function loadClassModuleOverrides(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
  phaseVTopicIds: Set<string>
): Promise<OverrideClassification> {
  const { data, error } = await supabase
    .from('class_modules')
    .select(
      'module_id, due_date, pass_threshold, modules(title, topic_id, activity_kind, display_mode, sort_order, is_published)'
    )
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Modul-Overrides konnten nicht geladen werden: ${error.message}`);
  }
  const overrideByModule: OverrideMap = new Map();
  const orphans: TopicModuleEntry[] = [];
  const legacyTopicIds = new Set<string>();
  for (const r of (data ?? []) as unknown as ClassModuleOverrideRow[]) {
    overrideByModule.set(r.module_id, {
      due_date: r.due_date,
      pass_threshold: r.pass_threshold,
    });
    classifyOverrideRow(r, phaseVTopicIds, orphans, legacyTopicIds);
  }
  return { overrideByModule, orphans, legacyTopicIds };
}

// Module aller relevanten Topics laden + nach Topic gruppieren.
async function loadModulesByTopic(
  svc: ReturnType<typeof createServiceClient>,
  phaseVTopicIds: Set<string>,
  legacyTopicIds: Set<string>,
  overrideByModule: OverrideMap
): Promise<Map<string, ModuleRow[]>> {
  const allTopicIds = new Set<string>([...phaseVTopicIds, ...legacyTopicIds]);
  const { data, error } = await svc
    .from('modules')
    .select('id, title, topic_id, activity_kind, display_mode, sort_order, is_published')
    .in('topic_id', Array.from(allTopicIds));
  if (error) {
    throw new Error(`Modul-Liste konnte nicht geladen werden: ${error.message}`);
  }
  const phaseVAssignedModuleIds = new Set(overrideByModule.keys());
  const modulesByTopic = new Map<string, ModuleRow[]>();
  for (const m of (data ?? []) as ModuleRow[]) {
    if (!shouldIncludeModuleRow(m, phaseVTopicIds, legacyTopicIds, phaseVAssignedModuleIds)) {
      continue;
    }
    const list = modulesByTopic.get(m.topic_id!) ?? [];
    list.push(m);
    modulesByTopic.set(m.topic_id!, list);
  }
  return modulesByTopic;
}

async function loadTopicMetadata(
  svc: ReturnType<typeof createServiceClient>,
  topicIds: Set<string>
): Promise<TopicRow[]> {
  const { data, error } = await svc
    .from('topics')
    .select('id, slug, label, description, schulstufe, kompetenzbereich, sort_order')
    .in('id', Array.from(topicIds));
  if (error) {
    throw new Error(`Themen-Metadaten konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as TopicRow[];
}

// Hauptfunktion: pro Klasse die zugewiesenen Themen + ggf. orphane Module.
export async function getAssignedTopicsForClass(
  classId: string
): Promise<{ topics: AssignedTopicForTeacher[]; orphanModules: TopicModuleEntry[] }> {
  const supabase = await createClient();
  const phaseVTopicIds = await loadClassTopicIds(supabase, classId);
  const { overrideByModule, orphans, legacyTopicIds } = await loadClassModuleOverrides(
    supabase,
    classId,
    phaseVTopicIds
  );
  const allTopicIds = new Set<string>([...phaseVTopicIds, ...legacyTopicIds]);
  if (allTopicIds.size === 0) {
    return { topics: [], orphanModules: orphans };
  }
  const svc = createServiceClient();
  const [modulesByTopic, topicRows] = await Promise.all([
    loadModulesByTopic(svc, phaseVTopicIds, legacyTopicIds, overrideByModule),
    loadTopicMetadata(svc, allTopicIds),
  ]);
  const topics = sortTopics(
    topicRows.map((t) =>
      buildTopic(
        t,
        modulesByTopic.get(t.id) ?? [],
        overrideByModule,
        phaseVTopicIds.has(t.id) ? 'topic' : 'modules_legacy'
      )
    )
  );
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
