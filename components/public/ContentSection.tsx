import type { ReactNode } from 'react';

// Abschnitt mit Titel + Leerzustand (für Materialien / Module auf der Thema-Seite).
export function ContentSection({
  title,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">{title}</h2>
      {isEmpty ? <p className="text-muted-foreground text-sm">{emptyText}</p> : children}
    </section>
  );
}
