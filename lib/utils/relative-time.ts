// Pure Helper: deutsche Relativzeit für „zuletzt geöffnet"-Anzeigen (V7,
// Lehrer-Heft-Übersicht). Deterministisch testbar über den now-Parameter.

// Volle Tage seit dem Zeitpunkt; null wenn kein/ungültiger Zeitstempel.
export function daysSince(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

export function formatRelativeDe(iso: string | null | undefined, now: Date = new Date()): string {
  const days = daysSince(iso, now);
  if (days === null) return 'noch nie geöffnet';
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}
