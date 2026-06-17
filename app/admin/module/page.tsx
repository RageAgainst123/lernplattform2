import { redirect } from 'next/navigation';

// Phase E: alte Sammelroute „Module" wird zu „Lernmodule" + „Präsentationen"
// aufgeteilt. Bookmark-Schutz: alte URL leitet zur Lernmodule-Liste — die
// häufigere Aktivität. Wer Präsentationen sucht: Admin-Nav links.

export default function AdminModuleRedirect() {
  redirect('/admin/lernmodule');
}
