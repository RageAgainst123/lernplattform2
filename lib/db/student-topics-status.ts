// Pure Status-Helper für die Themen-Aggregation in der Schüler:innen-Sicht.
// Keine Server-Abhängigkeiten — damit Tests + Client-Komponenten den Code
// ungestört importieren können. Die DB-Bindung lebt in student-topics.ts.

import type { ModuleStatus } from './student-modules-status';

// 3-Stufen-Status auf Themen-Ebene (aggregiert aus Modul-Status):
//   open        — kein Baustein begonnen
//   in_progress — mind. 1 Baustein begonnen oder fertig, aber nicht alle done
//   done        — alle Bausteine done (returned zählt NICHT als done)
export type TopicStatus = 'open' | 'in_progress' | 'done';

// Sperr-Check für Abschlusstest (Phase G5): nur freigeschaltet wenn ALLE
// Lernmodule des Themas Status `done` haben. Quiz + Präsentationen zählen
// NICHT als Voraussetzung — Quiz ist „ohne Konsequenz", Präsentationen sind
// Lehrer-only. Liefert zusätzlich Liste der noch offenen Lernmodul-Titel
// für die Hinweis-Anzeige.
export type LernmodulStatusEntry = {
  title: string;
  status: ModuleStatus;
};

export function canStartAbschlusstest(lernmodule: LernmodulStatusEntry[]): {
  allowed: boolean;
  missingTitles: string[];
} {
  const missing = lernmodule.filter((m) => m.status !== 'done');
  return {
    allowed: missing.length === 0 && lernmodule.length > 0,
    missingTitles: missing.map((m) => m.title),
  };
}

// Convenience-Wrapper für die Themen-Detailseite: nimmt das vollständige
// Modul-Array (alle Aktivitäten) und filtert intern auf Lernmodule. So
// können UI und Server-Schutz das gleiche Helper nutzen ohne doppelte
// Filter-Logik.
export type TopicModuleForCheck = {
  title: string;
  status: ModuleStatus;
  activityKind: 'lernmodul' | 'praesentation' | 'quiz' | 'abschlusstest';
};

export function getAbschlusstestUnlock(modules: TopicModuleForCheck[]): {
  allowed: boolean;
  missingTitles: string[];
} {
  const lernmodule = modules
    .filter((m) => m.activityKind === 'lernmodul')
    .map((m) => ({ title: m.title, status: m.status }));
  return canStartAbschlusstest(lernmodule);
}

// Aggregiert eine Liste von Modul-Stati zu einem Themen-Status + Counts.
// Die Counts werden für die Fortschritts-Anzeige (z.B. „2 von 5 erledigt")
// gebraucht. „returned" wird wie „in_progress" gewertet — das Kind muss
// noch arbeiten.
export function aggregateTopicStatus(moduleStatuses: ModuleStatus[]): {
  status: TopicStatus;
  total: number;
  done: number;
  inProgress: number;
} {
  const total = moduleStatuses.length;
  if (total === 0) {
    return { status: 'open', total: 0, done: 0, inProgress: 0 };
  }
  let done = 0;
  let inProgress = 0;
  for (const s of moduleStatuses) {
    if (s === 'done') done++;
    else if (s === 'in_progress' || s === 'returned') inProgress++;
  }
  let status: TopicStatus = 'open';
  if (done === total) status = 'done';
  else if (done + inProgress > 0) status = 'in_progress';
  return { status, total, done, inProgress };
}
