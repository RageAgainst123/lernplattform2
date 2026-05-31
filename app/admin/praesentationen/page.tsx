import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getModulesForAdminByKind } from '@/lib/db/modules';
import { buttonVariants } from '@/components/ui/button';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';
import { ACTIVITY_INFO } from '@/lib/activities';

// Admin-Liste der Präsentationen (Phase E). Filtert auf activity_kind='praesentation'.

export default async function AdminPraesentationenListPage() {
  await requireAdmin();
  const modules = await getModulesForAdminByKind('praesentation');
  const info = ACTIVITY_INFO.praesentation;
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{info.plural}</h1>
          <p className="text-muted-foreground text-sm">{info.description}</p>
        </div>
        <Link href="/admin/praesentationen/neu" className={buttonVariants()}>
          + Neue Präsentation
        </Link>
      </header>

      {modules.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Noch keine Präsentationen. Lege die erste an.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {modules.map((m) => (
            <li key={m.id} className="hover:bg-muted/40">
              <Link href={`/admin/praesentationen/${m.id}`} className="block px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.schulstufe ? `${m.schulstufe}. Stufe` : 'keine Stufe'}
                      {m.kompetenzbereich
                        ? ` · ${KOMPETENZBEREICH_INFO[m.kompetenzbereich].label}`
                        : ''}
                      {m.topic ? ` · ${m.topic}` : ''}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
