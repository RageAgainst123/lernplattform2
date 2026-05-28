import { createClient } from '@/lib/supabase/server';
import { KOMPETENZBEREICHE } from '@/lib/curriculum';
import type { Kompetenzbereich, MaterialType } from '@/lib/schemas/entities';
import {
  groupByTopic,
  type MaterialWithTopic,
  type PublicMaterial,
  type PublicModule,
  type TopicWithContent,
} from '@/lib/db/public-content';

// Stufen-weite Aggregation: lädt in ZWEI Queries alle Materialien + Module
// einer Schulstufe, gruppiert sie nach Kompetenzbereich → Thema. Liefert IMMER
// alle 5 Bereiche in der Lehrplan-Reihenfolge (KOMPETENZBEREICHE) — leere
// Bereiche bekommen `topics: []`, damit die Stufen-Seite sie trotzdem als
// aufklappbare Karte rendern kann.

const STORAGE_BUCKET = 'materials';

function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export type BereichWithTopics = {
  bereich: Kompetenzbereich;
  topics: TopicWithContent[];
};

type MaterialRowForBereich = {
  material: PublicMaterial;
  topic: string | null;
  bereich: Kompetenzbereich | null;
};

type ModuleRowForBereich = PublicModule & { kompetenzbereich: Kompetenzbereich | null };

// Pure Helper, ohne DB: gruppiert die zwei Listen nach Kompetenzbereich und
// reichert jede Gruppe via groupByTopic an. Rows mit `bereich === null` werden
// verworfen (z.B. alt-importierte Materialien ohne Bereich-Tagging).
export function groupByBereich(
  materials: MaterialRowForBereich[],
  modules: ModuleRowForBereich[]
): Map<Kompetenzbereich, TopicWithContent[]> {
  const matsByB = new Map<Kompetenzbereich, MaterialWithTopic[]>();
  const modsByB = new Map<Kompetenzbereich, PublicModule[]>();
  for (const row of materials) {
    if (!row.bereich) continue;
    const list = matsByB.get(row.bereich) ?? [];
    list.push({ material: row.material, topic: row.topic });
    matsByB.set(row.bereich, list);
  }
  for (const m of modules) {
    if (!m.kompetenzbereich) continue;
    const list = modsByB.get(m.kompetenzbereich) ?? [];
    list.push({ id: m.id, title: m.title, description: m.description, topic: m.topic });
    modsByB.set(m.kompetenzbereich, list);
  }
  const result = new Map<Kompetenzbereich, TopicWithContent[]>();
  const allBereiche = new Set<Kompetenzbereich>([...matsByB.keys(), ...modsByB.keys()]);
  for (const b of allBereiche) {
    result.set(b, groupByTopic(matsByB.get(b) ?? [], modsByB.get(b) ?? []));
  }
  return result;
}

// Stellt die feste Lehrplan-Reihenfolge her und ergänzt leere Bereiche.
function toOrderedArray(grouped: Map<Kompetenzbereich, TopicWithContent[]>): BereichWithTopics[] {
  return KOMPETENZBEREICHE.map((bereich) => ({
    bereich,
    topics: grouped.get(bereich) ?? [],
  }));
}

// Server-Funktion: ZWEI Queries für die ganze Stufe, dann pure Gruppierung.
export async function getStufeWithBereiche(schulstufe: number): Promise<BereichWithTopics[]> {
  const supabase = await createClient();
  const [matRes, modRes] = await Promise.all([
    supabase
      .from('materials')
      .select('id, title, description, material_type, file_path, topic, kompetenzbereich')
      .eq('schulstufe', schulstufe),
    supabase
      .from('modules')
      .select('id, title, description, topic, kompetenzbereich')
      .eq('schulstufe', schulstufe)
      .eq('is_published', true),
  ]);

  const materials: MaterialRowForBereich[] = (matRes.data ?? []).map((m) => ({
    material: {
      id: m.id,
      title: m.title,
      description: m.description,
      materialType: m.material_type as MaterialType,
      fileUrl: publicUrl(m.file_path as string),
    },
    topic: (m.topic as string | null) ?? null,
    bereich: (m.kompetenzbereich as Kompetenzbereich | null) ?? null,
  }));
  const modules: ModuleRowForBereich[] = (modRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    topic: m.topic,
    kompetenzbereich: (m.kompetenzbereich as Kompetenzbereich | null) ?? null,
  }));

  return toOrderedArray(groupByBereich(materials, modules));
}
