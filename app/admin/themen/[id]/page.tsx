import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getTopicByIdForAdmin } from '@/lib/db/topics';
import { getAvailableModulesForTopic, getModulesForTopic } from '@/lib/db/modules';
import { getTopicClassAssignmentCount } from '@/lib/db/class-topics';
import type { ActivityKind, Module } from '@/lib/schemas/entities';
import { ACTIVITY_KINDS } from '@/lib/activities';
import { TopicEditor } from '@/components/admin/TopicEditor';
import { TopicBausteine } from '@/components/admin/TopicBausteine';
import type { TopicFormValue } from '@/components/admin/TopicForm';
import type { ModuleOptionWithSource } from '@/lib/db/modules';

// Themen-Detailseite (Phase G). Oben Metadaten-Editor (TopicEditor mit Save-
// Header), darunter Bausteine-Zuordnung pro Aktivitäts-Typ.

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const topic = await getTopicByIdForAdmin(id);
  if (!topic) notFound();

  // Module gruppiert nach Aktivität (sortiert nach sort_order pro Thema).
  // V6: parallel die Klassen-Zuweisungs-Zahl für die Lösch-Warnung laden.
  const [allTopicModules, assignedClassCount] = await Promise.all([
    getModulesForTopic(id),
    getTopicClassAssignmentCount(id),
  ]);
  const modulesByKind = groupByKind(allTopicModules);

  // Verfügbare Module pro Aktivität für das Add-Dropdown — inklusive Module
  // die schon einem ANDEREN Thema zugeordnet sind (werden beim Hinzufügen
  // umgehängt, siehe setModuleTopic). Wichtig für Geos Workflow nach der
  // Migration 0013, wo alle Module einem Bestand-Thema zugeordnet wurden.
  const availableEntries = await Promise.all(
    ACTIVITY_KINDS.map(async (k) => [k, await getAvailableModulesForTopic(id, k)] as const)
  );
  const availableByKind = Object.fromEntries(availableEntries) as Record<
    ActivityKind,
    ModuleOptionWithSource[]
  >;

  const formValue: TopicFormValue = {
    slug: topic.slug,
    label: topic.label,
    description: topic.description ?? '',
    schulstufe: topic.schulstufe ?? null,
    kompetenzbereich: topic.kompetenzbereich ?? null,
    isPublished: topic.isPublished,
    sortOrder: topic.sortOrder,
  };

  return (
    <div className="space-y-8">
      <TopicEditor topicId={id} initialValue={formValue} assignedClassCount={assignedClassCount} />
      <TopicBausteine
        topicId={id}
        modulesByKind={modulesByKind}
        availableByKind={availableByKind}
      />
    </div>
  );
}

function groupByKind(modules: Module[]): Record<ActivityKind, Module[]> {
  const init = Object.fromEntries(ACTIVITY_KINDS.map((k) => [k, [] as Module[]])) as Record<
    ActivityKind,
    Module[]
  >;
  for (const m of modules) {
    init[m.activityKind].push(m);
  }
  return init;
}
