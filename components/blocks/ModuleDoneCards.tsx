import Link from 'next/link';
import type { Block } from '@/lib/schemas/blocks';
import type { BlockResult } from '@/lib/blocks/evaluate';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Server-Komponenten für die Quiz-Endseite (R1.1). Ausgelagert aus
// app/s/modul/[id]/done/page.tsx wegen max-lines-per-function (Lint).

export type ResultItem = {
  id: string;
  label: string;
  result: BlockResult;
};

export function ScoreHeroCard({
  moduleTitle,
  correctCount,
  total,
  percent,
  children,
}: {
  moduleTitle: string;
  correctCount: number;
  total: number;
  percent: number | null;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Geschafft!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg">
          Du hast <span className="font-medium">{moduleTitle}</span> abgeschlossen.
        </p>
        {percent !== null && (
          <div className="bg-muted/30 rounded-lg border p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">Dein Ergebnis</span>
              <span className="text-3xl font-semibold tabular-nums">
                {correctCount} / {total}
              </span>
            </div>
            <div className="text-primary mt-1 text-right text-2xl font-medium tabular-nums">
              {percent}%
            </div>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export function AnswerOverviewCard({
  moduleId,
  items,
  wrongCount,
}: {
  moduleId: string;
  items: ResultItem[];
  wrongCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Antwort-Übersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="bg-card flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate pr-3">{it.label}</span>
              <ResultBadge result={it.result} />
            </li>
          ))}
        </ul>
        {wrongCount > 0 && (
          <Link
            href={`/s/modul/${moduleId}?wrongOnly=1`}
            className={`${buttonVariants({ variant: 'secondary' })} mt-4 w-full`}
          >
            🔁 Falsche Fragen wiederholen ({wrongCount})
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function ReflectionsCard({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deine Reflexionen</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Reflexionsfragen werden nicht automatisch bewertet —
          {count === 1 ? ' du hast sie' : ' du hast sie alle'} beantwortet.
        </p>
      </CardContent>
    </Card>
  );
}

export function ModuleNotAvailable() {
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <Card>
        <CardHeader>
          <CardTitle>Modul nicht verfügbar</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/s" className={buttonVariants()}>
            Zurück zur Übersicht
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultBadge({ result }: { result: BlockResult }) {
  if (result === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-green-600/30 ring-inset">
        ✓ richtig
      </span>
    );
  }
  if (result === 'wrong') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-600/30 ring-inset">
        ✗ falsch
      </span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground ring-border inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset">
      nicht bewertet
    </span>
  );
}

// Kurzes Label pro Block für die Übersicht. Frage-Text priorisiert, fällt
// zurück auf Block-Typ. Schneidet bei 60 Zeichen ab.
export function blockShortLabel(block: Block, n: number): string {
  const prefix = `Frage ${n}: `;
  const raw =
    ('question' in block && typeof block.question === 'string' && block.question) ||
    ('text' in block && typeof block.text === 'string' && block.text) ||
    block.type;
  const trimmed = String(raw).trim();
  if (trimmed.length <= 60) return prefix + trimmed;
  return prefix + trimmed.slice(0, 57) + '…';
}
