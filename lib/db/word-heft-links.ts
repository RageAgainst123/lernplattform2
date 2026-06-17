import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { WordHeftLink, ValidationStatus } from '@/lib/schemas/entities';

// Phase Q (Modell ab Migration 0019): EIN Word-Heft pro Schüler:in.
// Generelles Schulübungsheft, NICHT pro Thema. Schüler:in legt einmal an,
// nutzt es in allen Themen-Lernpfaden.
//
// Schreib-Pfad (Schüler:in):  Service-Role, weil kein auth.uid()
// Lese-Pfad Schüler:in:       Service-Role (Owner-Check über jose-Session)
// Lese-Pfad Lehrer:in:        User-Client + RLS

type Row = {
  id: string;
  student_code_id: string;
  topic_id: string | null;
  one_drive_url: string;
  display_name: string | null;
  validation_status: ValidationStatus;
  last_validated_at: string | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
};

function toWordHeftLink(row: Row): WordHeftLink {
  return {
    id: row.id,
    studentCodeId: row.student_code_id,
    topicId: row.topic_id,
    oneDriveUrl: row.one_drive_url,
    displayName: row.display_name,
    validationStatus: row.validation_status,
    lastValidatedAt: row.last_validated_at,
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Schüler:in: das EINE Heft (oder null).
export async function getWordHeftLinkForStudent(
  studentCodeId: string
): Promise<WordHeftLink | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('word_heft_links')
    .select('*')
    .eq('student_code_id', studentCodeId)
    .maybeSingle();
  return data ? toWordHeftLink(data as Row) : null;
}

// Lehrer:in: alle Hefte einer Klasse (User-Client + RLS).
// RLS-Policy word_heft_links_select_own_class_students filtert auf Klassen
// der eingeloggten Lehrer:in.
export async function getWordHeftLinksForClass(classId: string): Promise<WordHeftLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('word_heft_links')
    .select('*, student_codes!inner(class_id)')
    .eq('student_codes.class_id', classId)
    .order('updated_at', { ascending: false });
  if (error) {
    throw new Error(`Klassen-Word-Hefte nicht ladbar: ${error.message}`);
  }
  return ((data ?? []) as Row[]).map(toWordHeftLink);
}

// Upsert auf student_code_id (Unique-Constraint aus Migration 0019).
// Wenn Schüler:in schon ein Heft hat → update URL/Status. Sonst insert.
export async function upsertWordHeftLink(args: {
  studentCodeId: string;
  oneDriveUrl: string;
  displayName: string | null;
  validationStatus: ValidationStatus;
}): Promise<WordHeftLink> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('word_heft_links')
    .upsert(
      {
        student_code_id: args.studentCodeId,
        one_drive_url: args.oneDriveUrl,
        display_name: args.displayName,
        validation_status: args.validationStatus,
        last_validated_at: args.validationStatus === 'pending' ? null : now,
      },
      { onConflict: 'student_code_id' }
    )
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Word-Heft-Link konnte nicht gespeichert werden: ${error?.message}`);
  }
  return toWordHeftLink(data as Row);
}

// Schüler:in markiert ihr Heft als zuletzt geöffnet (für UI-Anzeige).
export async function touchWordHeftLinkOpened(
  linkId: string,
  studentCodeId: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('word_heft_links')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', linkId)
    .eq('student_code_id', studentCodeId);
}

// Schüler:in löscht ihren Heft-Link (die Datei in OneDrive bleibt erhalten).
export async function deleteWordHeftLink(linkId: string, studentCodeId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('word_heft_links')
    .delete()
    .eq('id', linkId)
    .eq('student_code_id', studentCodeId);
}
