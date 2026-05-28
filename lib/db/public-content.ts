import { createClient } from '@/lib/supabase/server';
import type { Kompetenzbereich, MaterialType } from '@/lib/schemas/entities';

// Öffentliche Inhalts-Queries (kein Login). RLS gibt anon nur published Module
// und nicht-lehrer-exklusive Materialien frei — kein Service-Role nötig.

const STORAGE_BUCKET = 'materials';

export type PublicMaterial = {
  id: string;
  title: string;
  description: string | null;
  materialType: MaterialType;
  fileUrl: string;
};

export type PublicModule = {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
};

export type Topic = { topic: string; materialCount: number; moduleCount: number };

// Ein Thema MIT seinen Inhalten in einem Rutsch — Quelle für die
// Bereich-Seite mit aufklappbarem Accordion (drei statt vier Klick-Ebenen).
export type TopicWithContent = {
  topic: string;
  slug: string;
  materials: PublicMaterial[];
  modules: PublicModule[];
};

function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

// URL-Slug aus einem Thema-Titel (z.B. "EVA-Prinzip" → "eva-prinzip").
export function topicSlug(topic: string): string {
  return topic.toLowerCase().replace(/\s+/g, '-');
}

// Distinkte Themen eines Kompetenzbereichs in einer Schulstufe (aus Materialien
// + Modulen kombiniert), mit Anzahl je Art — für die Themen-Übersicht.
export async function getTopics(schulstufe: number, bereich: Kompetenzbereich): Promise<Topic[]> {
  const supabase = await createClient();
  const [mats, mods] = await Promise.all([
    supabase
      .from('materials')
      .select('topic')
      .eq('schulstufe', schulstufe)
      .eq('kompetenzbereich', bereich),
    supabase
      .from('modules')
      .select('topic')
      .eq('schulstufe', schulstufe)
      .eq('kompetenzbereich', bereich)
      .eq('is_published', true),
  ]);

  const map = new Map<string, Topic>();
  for (const row of mats.data ?? []) {
    if (!row.topic) continue;
    const t = map.get(row.topic) ?? { topic: row.topic, materialCount: 0, moduleCount: 0 };
    t.materialCount += 1;
    map.set(row.topic, t);
  }
  for (const row of mods.data ?? []) {
    if (!row.topic) continue;
    const t = map.get(row.topic) ?? { topic: row.topic, materialCount: 0, moduleCount: 0 };
    t.moduleCount += 1;
    map.set(row.topic, t);
  }
  return [...map.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}

// Materialien eines konkreten Themas (öffentlich), inkl. fertiger Download-URL.
export async function getMaterials(
  schulstufe: number,
  bereich: Kompetenzbereich,
  topic: string
): Promise<PublicMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('materials')
    .select('id, title, description, material_type, file_path')
    .eq('schulstufe', schulstufe)
    .eq('kompetenzbereich', bereich)
    .eq('topic', topic)
    .order('title');
  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    materialType: m.material_type as MaterialType,
    fileUrl: publicUrl(m.file_path as string),
  }));
}

// Veröffentlichte Module eines konkreten Themas (öffentlich sichtbar, Bearbeiten
// nur nach Zuweisung/Login).
export async function getPublicModules(
  schulstufe: number,
  bereich: Kompetenzbereich,
  topic: string
): Promise<PublicModule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('modules')
    .select('id, title, description, topic')
    .eq('schulstufe', schulstufe)
    .eq('kompetenzbereich', bereich)
    .eq('topic', topic)
    .eq('is_published', true)
    .order('title');
  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    topic: m.topic,
  }));
}

// Eintrag im Group-Helper: Material + sein Thema-Zuordnung (ohne `topic` im
// öffentlichen `PublicMaterial`-Type zu verankern — UI braucht's nicht).
type MaterialWithTopic = { material: PublicMaterial; topic: string | null };

// Pure Helper: gruppiert Materialien + Module nach Thema, sortiert.
// Themen alphabetisch, innerhalb jedes Themas Materialien + Module je nach
// Titel. Materialien/Module ohne `topic` werden verworfen (keine Schub-Schublade).
// Getestet in public-content.test.ts ohne DB-Mock.
export function groupByTopic(
  materials: MaterialWithTopic[],
  modules: PublicModule[]
): TopicWithContent[] {
  const map = new Map<string, TopicWithContent>();
  const ensure = (key: string): TopicWithContent => {
    const existing = map.get(key);
    if (existing) return existing;
    const entry = { topic: key, slug: topicSlug(key), materials: [], modules: [] };
    map.set(key, entry);
    return entry;
  };
  for (const { material, topic } of materials) {
    if (!topic) continue;
    ensure(topic).materials.push(material);
  }
  for (const m of modules) {
    if (!m.topic) continue;
    ensure(m.topic).modules.push(m);
  }
  for (const entry of map.values()) {
    entry.materials.sort((a, b) => a.title.localeCompare(b.title));
    entry.modules.sort((a, b) => a.title.localeCompare(b.title));
  }
  return [...map.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}

// Alle Themen eines Kompetenzbereichs inkl. ihrer Materialien + Module in
// EINEM Aufruf. Quelle für die Bereich-Seite mit Accordion: spart eine
// Klick-Ebene und vermeidet N+1-Queries beim Aufklappen.
export async function getBereichWithTopics(
  schulstufe: number,
  bereich: Kompetenzbereich
): Promise<TopicWithContent[]> {
  const supabase = await createClient();
  const [matRes, modRes] = await Promise.all([
    supabase
      .from('materials')
      .select('id, title, description, material_type, file_path, topic')
      .eq('schulstufe', schulstufe)
      .eq('kompetenzbereich', bereich),
    supabase
      .from('modules')
      .select('id, title, description, topic')
      .eq('schulstufe', schulstufe)
      .eq('kompetenzbereich', bereich)
      .eq('is_published', true),
  ]);

  const materials: MaterialWithTopic[] = (matRes.data ?? []).map((m) => ({
    material: {
      id: m.id,
      title: m.title,
      description: m.description,
      materialType: m.material_type as MaterialType,
      fileUrl: publicUrl(m.file_path as string),
    },
    topic: (m.topic as string | null) ?? null,
  }));
  const modules: PublicModule[] = (modRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    topic: m.topic,
  }));

  return groupByTopic(materials, modules);
}
