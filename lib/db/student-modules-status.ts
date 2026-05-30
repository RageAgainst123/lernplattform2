// Reine Status-Helper für die Modul-Klassifizierung. Keine Server-
// Abhängigkeiten — damit Tests + Client-Komponenten den Code ungestört
// importieren können. Die DB-Bindung lebt in student-modules.ts.

// 4-Stufen-Status:
//   open        — noch nichts angefangen
//   in_progress — begonnen, aber nicht abgegeben
//   returned    — von der Lehrer:in zur Überarbeitung zurückgegeben
//   done        — abgegeben (und nicht zurückgegeben)
export type ModuleStatus = 'open' | 'in_progress' | 'returned' | 'done';

export type ProgressRow = {
  module_id: string;
  completed_at: string | null;
  // Optional → abwärtskompatibel mit alten Aufrufern/Daten ohne Rückgabe.
  returned_at?: string | null;
};

// Leitet den Status einer einzelnen Progress-Row ab.
//   returned_at gesetzt UND nicht (wieder) abgegeben → 'returned'
//   completed_at gesetzt                              → 'done'
//   sonst (Row existiert, aber offen)                 → 'in_progress'
// 'open' wird hier NICHT erzeugt (keine Row = open; Aufrufer setzt Default).
export function deriveStatus(row: ProgressRow): ModuleStatus {
  if (row.returned_at && !row.completed_at) {
    return 'returned';
  }
  if (row.completed_at) {
    return 'done';
  }
  return 'in_progress';
}

// Bildet eine Map module_id → status aus den Progress-Rows. Kein Eintrag =
// 'open' (Aufrufer setzt Default).
export function progressStatusMap(rows: ProgressRow[]): Map<string, ModuleStatus> {
  const map = new Map<string, ModuleStatus>();
  for (const row of rows) {
    map.set(row.module_id, deriveStatus(row));
  }
  return map;
}

// Reihenfolge fürs Dashboard: zuerst was dringend ist (returned → überarbeiten),
// dann was gerade dran ist (in_progress), dann offen, zuletzt erledigt.
// Innerhalb derselben Status-Stufe bleibt die ursprüngliche Reihenfolge erhalten.
const SORT_PRIORITY: Record<ModuleStatus, number> = {
  returned: 0,
  in_progress: 1,
  open: 2,
  done: 3,
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
  const counts: StatusCounts = { open: 0, in_progress: 0, returned: 0, done: 0 };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}
