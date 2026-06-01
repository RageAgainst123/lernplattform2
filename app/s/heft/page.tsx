import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getPortfolioEntriesForStudent } from '@/lib/db/portfolio';
import { buttonVariants } from '@/components/ui/button';

// Heft-Übersicht (Phase H1). Liste aller eigenen Einträge der Schüler:in
// sortiert nach updated_at. Klick auf einen Eintrag → /s/heft/[id] (Editor).
// „+ Neue Notiz" → /s/heft/neu legt sofort eine leere Zeile an und
// redirected in den Editor.

export const metadata: Metadata = {
  title: 'Mein Heft',
};

export default async function NotebookListPage() {
  const session = await requireStudentSession();
  const entries = await getPortfolioEntriesForStudent(session.studentCodeId);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <Link href="/s" className="text-muted-foreground text-sm hover:underline">
        ← Zurück zum Dashboard
      </Link>
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>📓</span>
          Mein Heft
        </h1>
        <Link href="/s/heft/neu" className={buttonVariants()}>
          + Neue Notiz
        </Link>
      </header>

      {entries.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Noch keine Einträge. Klick auf {'„+ Neue Notiz"'} um zu starten.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/s/heft/${entry.id}`}
                className="hover:bg-muted/40 block rounded-md border px-4 py-3"
              >
                <p className="truncate font-medium">{entry.title || 'Ohne Titel'}</p>
                <p className="text-muted-foreground text-xs">
                  Zuletzt geändert: {formatDate(entry.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  // Browser-Sprache nutzen, dann fallback auf de-AT. Server-seitiges Format
  // reicht — wir brauchen keine Mikrosekunden-Genauigkeit.
  try {
    return new Date(iso).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
