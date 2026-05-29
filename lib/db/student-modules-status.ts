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
