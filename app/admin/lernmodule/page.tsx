import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModulesForAdminByKind } from '@/lib/db/modules';
import { buttonVariants } from '@/components/ui/button';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';
import { ACTIVITY_INFO } from '@/lib/activities';
import { DuplicateModuleButton } from '@/components/admin/DuplicateModuleButton';

// Admin-Liste der Lernmodule (Phase E). Filtert auf activity_kind='lernmodul' —
// Präsentationen erscheinen unter /admin/praesentationen, nicht hier.

export default async function AdminLernmoduleListPage() {
  await requireAdmin();
  const modules = await getModulesForAdminByKind('lernmodul');
  const info = ACTIVITY_INFO.lernmodul;
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{info.plural}</h1>
          <p className="text-muted-foreground text-sm">{info.description}</p>
        </div>
        <Link href="/admin/lernmodule/neu" className={buttonVariants()}>
          + Neues Lernmodul
        </Link>
      </header>

      {modules.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Noch keine Lernmodule. Lege das erste an.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {modules.map((m) => (
            <li key={m.id} className="hover:bg-muted/40">
              <div className="flex items-center gap-1 pr-2">
                <Link href={`/admin/lernmodule/${m.id}`} className="block min-w-0 flex-1 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {m.schulstufe ? `${m.schulstufe}. Stufe` : 'keine Stufe'}
                        {m.kompetenzbereich
                          ? ` · ${KOMPETENZBEREICH_INFO[m.kompetenzbereich].label}`
                          : ''}
                        {m.topic ? ` · ${m.topic}` : ''}
                        {' · '}
                        {m.displayMode === 'worksheet' ? 'Arbeitsblatt-Modus' : 'Quiz-Modus'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        m.isPublished
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {m.isPublished ? 'veröffentlicht' : 'Entwurf'}
                    </span>
                  </div>
                </Link>
                <DuplicateModuleButton moduleId={m.id} activityKind="lernmodul" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
