import Link from 'next/link';

// Große, klickbare Kachel für die öffentliche Navigation (Stufe, Bereich, Thema).
// Bewusst schlichtes Markup (kein shadcn-Card-Grid) für ein vorhersagbares,
// volle-Breite-Layout im Grid der Elternseite.
export function TileLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="hover:border-primary hover:bg-muted/50 block h-full rounded-xl border p-5 transition-colors"
    >
      <h2 className="text-xl font-medium break-words hyphens-auto">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
    </Link>
  );
}
