import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModuleByIdForAdmin } from '@/lib/db/modules';
import { ACTIVITY_INFO } from '@/lib/activities';

// Phase E: alte Edit-URL leitet dynamisch auf die richtige Aktivitäts-Route.
// Bookmark-Schutz: existierende Module bleiben über ihre alte URL erreichbar.

export default async function EditModuleRedirect({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const mod = await getModuleByIdForAdmin(id);
  if (!mod) notFound();
  const segment = ACTIVITY_INFO[mod.activityKind].urlSegment;
  redirect(`/admin/${segment}/${id}`);
}
