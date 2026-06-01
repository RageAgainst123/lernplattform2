import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getTopicsForAdmin } from '@/lib/db/topics';
import { buttonVariants } from '@/components/ui/button';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';

// Admin-Themen-Liste (Phase G). Themen sind first-class Lernpfade — ein
// Thema bündelt mehrere Lernmodule, Präsentationen, Quiz und einen
// Abschlusstest in einer Reihenfolge. Sortiert nach Schulstufe + Bereich +
// Reihenfolge (sort_order pro Bereich).

export default async function AdminTopicsListPage() {
  await requireAdmin();
  const topics = await getTopicsForAdmin();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">📚 Themen</h1>
          <p className="text-muted-foreground text-sm">
            Themen bündeln Lernmodule, Präsentationen, Quiz und einen Abschlusstest in einer
            Reihenfolge. Schüler:innen sehen sie als Lernpfad-Karten im Dashboard.
          </p>
        </div>
        <Link href="/admin/themen/neu" className={buttonVariants()}>
          + Neues Thema
        </Link>
      </header>

      {topics.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Noch keine Themen. Lege das erste an — oder importiere bestehende Module einem neuen Thema
          zu.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {topics.map((t) => (
            <li key={t.id} className="hover:bg-muted/40">
              <Link href={`/admin/themen/${t.id}`} className="block px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.schulstufe ? `${t.schulstufe}. Stufe` : 'keine Stufe'}
                      {t.kompetenzbereich
                        ? ` · ${KOMPETENZBEREICH_INFO[t.kompetenzbereich].label}`
                        : ''}
                      {' · '}
                      {t.slug}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                      t.isPublished
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.isPublished ? 'veröffentlicht' : 'Entwurf'}
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
