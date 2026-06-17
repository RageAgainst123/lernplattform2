'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Admin-Sidebar-Nav als Client-Komponente, damit usePathname() funktioniert
// und die aktive Route visuell hervorgehoben werden kann (vorher gab es im
// Layout keine Active-Markierung — beim Smoke-Test ein klarer UX-Mangel).

export type AdminNavItem = {
  href: string;
  label: string;
  emoji: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col" aria-label="Admin-Navigation">
      {items.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'bg-primary/10 text-primary inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium'
            }
          >
            <span aria-hidden>{n.emoji}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
