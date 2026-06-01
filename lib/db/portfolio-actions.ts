'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { portfolioEntryInsertSchema } from '@/lib/schemas/entities';

// Server Actions für portfolio_entries (Phase H1).
//
// SICHERHEIT (CRITICAL):
//   - studentCodeId IMMER aus jose-Session, NIE aus Client-Param.
//   - Service-Role-Client weil Schüler:innen kein auth.uid haben.
//   - Owner-Check bei UPDATE/DELETE: WHERE student_code_id = session.
//     Ein manipuliertes entry-id mit fremdem Code kann nichts überschreiben.

export type PortfolioActionState = { error: string | null };

// Eintrag anlegen. Optional mit topic_id. Liefert die neue ID via redirect.
export async function createPortfolioEntry(input: unknown): Promise<{ id: string }> {
  const session = await requireStudentSession();
  const parsed = portfolioEntryInsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Eingabe ungültig: ' + parsed.error.issues.map((i) => i.message).join('; '));
  }
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('portfolio_entries')
    .insert({
      student_code_id: session.studentCodeId,
      topic_id: parsed.data.topicId ?? null,
      title: parsed.data.title ?? null,
      content_json: parsed.data.contentJson,
    })
    .select('id')
    .single();
  if (error) {
    throw new Error('Eintrag konnte nicht angelegt werden: ' + error.message);
  }
  revalidatePath('/s/heft');
  return { id: data.id as string };
}

// Eintrag aktualisieren (Auto-Save). Owner-Check via WHERE-Clause.
// Liefert ein Result-Objekt damit der Client (Auto-Save) keinen
// error-boundary-Crash riskiert.
export async function updatePortfolioEntry(
  entryId: string,
  patch: { title?: string; contentJson?: Record<string, unknown> }
): Promise<PortfolioActionState> {
  const session = await requireStudentSession();
  if (!entryId) return { error: 'Eintrag-ID fehlt.' };
  const svc = createServiceClient();
  const updateData: Record<string, unknown> = {};
  if (patch.title !== undefined) updateData.title = patch.title || null;
  if (patch.contentJson !== undefined) updateData.content_json = patch.contentJson;
  if (Object.keys(updateData).length === 0) return { error: null };
  const { error } = await svc
    .from('portfolio_entries')
    .update(updateData)
    .eq('id', entryId)
    .eq('student_code_id', session.studentCodeId);
  if (error) {
    return { error: 'Eintrag konnte nicht gespeichert werden: ' + error.message };
  }
  revalidatePath('/s/heft');
  revalidatePath(`/s/heft/${entryId}`);
  return { error: null };
}

// Eintrag löschen. Owner-Check via WHERE. Redirect zur Heft-Liste.
export async function deletePortfolioEntry(entryId: string): Promise<void> {
  const session = await requireStudentSession();
  if (!entryId) throw new Error('Eintrag-ID fehlt.');
  const svc = createServiceClient();
  const { error } = await svc
    .from('portfolio_entries')
    .delete()
    .eq('id', entryId)
    .eq('student_code_id', session.studentCodeId);
  if (error) {
    throw new Error('Eintrag konnte nicht gelöscht werden: ' + error.message);
  }
  revalidatePath('/s/heft');
  redirect('/s/heft');
}
