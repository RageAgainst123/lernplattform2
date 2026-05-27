import Link from 'next/link';

// Einfache Breadcrumb-Zeile: ein Link auf die übergeordnete Seite + aktueller Titel.
export function Breadcrumb({
  parentHref,
  parentLabel,
  current,
}: {
  parentHref: string;
  parentLabel: string;
  current: string;
}) {
  return (
    <nav className="text-muted-foreground text-sm">
      <Link href={parentHref} className="hover:underline">
        {parentLabel}
      </Link>{' '}
      / {current}
    </nav>
  );
}
