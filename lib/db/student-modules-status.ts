// Reine Status-Helper für die 3-stufige Modul-Klassifizierung. Keine
// Server-Abhängigkeiten — damit Tests + Client-Komponenten den Code
// ungestört importieren können. Die DB-Bindung lebt in student-modules.ts.

// 3-Stufen-Status: noch nichts angefangen | begonnen, aber nicht abgegeben |
// abgeschlossen.
export type ModuleStatus = 'open' | 'in_progress' | 'done';

export type ProgressRow = { module_id: string; completed_at: string | null };

// Bildet eine Map module_id → status aus den Progress-Rows. Kein Eintrag =
// 'open' (Aufrufer setzt Default). completed_at != null = 'done'. Sonst
// 'in_progress'.
export function progressStatusMap(rows: ProgressRow[]): Map<string, ModuleStatus> {
  const map = new Map<string, ModuleStatus>();
  for (const row of rows) {
    map.set(row.module_id, row.completed_at ? 'done' : 'in_progress');
  }
  return map;
}

// Reihenfolge fürs Dashboard: zuerst was gerade dran ist (in_progress),
// dann was noch zu tun ist (open), zuletzt das Erledigte. Innerhalb
// derselben Status-Stufe wird die ursprüngliche Reihenfolge erhalten.
const SORT_PRIORITY: Record<ModuleStatus, number> = {
  in_progress: 0,
  open: 1,
  done: 2,
};

export function sortByStatus<T extends { status: ModuleStatus }>(items: T[]): T[] {
  return items
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const p = SORT_PRIORITY[a.item.status] - SORT_PRIORITY[b.item.status];
      return p !== 0 ? p : a.idx - b.idx;
    })
    .map(({ item }) => item);
}

export type StatusCounts = Record<ModuleStatus, number>;

export function countByStatus<T extends { status: ModuleStatus }>(items: T[]): StatusCounts {
  const counts: StatusCounts = { open: 0, in_progress: 0, done: 0 };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}
