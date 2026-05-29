import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getMaterialsForAdmin } from '@/lib/db/materials';
import { buttonVariants } from '@/components/ui/button';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';

export default async function AdminMaterialListPage() {
  await requireAdmin();
  const materials = await getMaterialsForAdmin();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Materialien</h1>
        <Link href="/admin/material/neu" className={buttonVariants()}>
          + Neues Material
        </Link>
      </header>

      {materials.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Noch keine Materialien. Lade das erste PDF hoch.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {materials.map((m) => (
            <li key={m.id} className="hover:bg-muted/40">
              <Link href={`/admin/material/${m.id}`} className="block px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.schulstufe ? `${m.schulstufe}. Stufe` : 'keine Stufe'}
                      {m.kompetenzbereich
                        ? ` · ${KOMPETENZBEREICH_INFO[m.kompetenzbereich].label}`
                        : ''}
                      {m.topic ? ` · ${m.topic}` : ''}
                    </p>
                    {m.relatedModuleTitle && (
                      <p className="text-primary mt-1 text-xs">
                        ↔ verknüpft mit Modul &bdquo;{m.relatedModuleTitle}&ldquo;
                      </p>
                    )}
                  </div>
                  {m.isTeacherOnly && (
                    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs">
                      nur Lehrer:innen
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
