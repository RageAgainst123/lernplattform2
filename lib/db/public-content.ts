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
