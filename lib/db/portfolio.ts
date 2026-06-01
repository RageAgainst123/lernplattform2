import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import type { PortfolioEntry } from '@/lib/schemas/entities';

// Read-Funktionen für portfolio_entries (Phase H1: Schulheft).
// Sicherheits-Modell: Schüler:innen haben kein auth.uid → wir filtern
// applikationsseitig auf student_code_id, der aus der jose-Session kommt
// (NIEMALS aus Client-Param, sonst Cross-User-Lesen möglich).

type PortfolioRow = {
  id: string;
  student_code_id: string;
  topic_id: string | null;
  title: string | null;
  content_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function toEntry(row: PortfolioRow): PortfolioEntry {
  return {
    id: row.id,
    studentCodeId: row.student_code_id,
    topicId: row.topic_id,
    title: row.title ?? undefined,
    contentJson: row.content_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Liste aller Einträge einer Schüler:in, nach Aktualität sortiert.
// Für /s/heft. Der studentCodeId-Parameter MUSS aus der jose-Session
// kommen — der Caller in der Page-Route ruft requireStudentSession().
export async function getPortfolioEntriesForStudent(
  studentCodeId: string
): Promise<PortfolioEntry[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('portfolio_entries')
    .select('*')
    .eq('student_code_id', studentCodeId)
    .order('updated_at', { ascending: false });
  if (error) {
    throw new Error(`Heft-Einträge konnten nicht geladen werden: ${error.message}`);
  }
  return ((data ?? []) as PortfolioRow[]).map(toEntry);
}

// Ein einzelner Eintrag. Liefert null wenn Eintrag fehlt ODER der Eintrag
// einem anderen Kind gehört — beides aus Sicht der Page identisch (notFound).
export async function getPortfolioEntry(
  entryId: string,
  studentCodeId: string
): Promise<PortfolioEntry | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('portfolio_entries')
    .select('*')
    .eq('id', entryId)
    .eq('student_code_id', studentCodeId)
    .maybeSingle();
  if (error) {
    throw new Error(`Heft-Eintrag konnte nicht geladen werden: ${error.message}`);
  }
  return data ? toEntry(data as PortfolioRow) : null;
}
