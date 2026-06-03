// Punkte-Formel für alle Quiz-Modi.
//
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §8.
// Verwendung:
//   • Sprint R (Solo) — clientseitig in useModuleRunner, nur Anzeige,
//     KEINE DB-Persistierung.
//   • Phase S (Live/Hausaufgabe/Team) — serverseitig in submitQuizAnswer,
//     wandert in quiz_answers.points_awarded + quiz_participants.total_points.
//
// Pure Funktion, keine Dependencies, voll testbar (siehe points.test.ts).

/**
 * Streak-Tiers (höchster passender wird gewählt, NICHT kumulativ).
 * Reihenfolge: absteigend nach `min`, damit der erste Treffer der höchste ist.
 */
const STREAK_TIERS = [
  { min: 7, bonus: 500 },
  { min: 5, bonus: 250 },
  { min: 3, bonus: 100 },
] as const;

/**
 * Streak-Bonus für die aktuelle Streak-Länge. 0 bei < 3 (kein Bonus).
 * Negative Werte werden defensiv als 0 behandelt.
 */
export function streakBonus(newStreak: number): number {
  if (newStreak < 3) {
    return 0;
  }
  const tier = STREAK_TIERS.find((t) => newStreak >= t.min);
  return tier?.bonus ?? 0;
}

/**
 * Kahoot-Style Zeit-Bonus + Streak-Bonus.
 *
 * - `correct=false` → 0 Punkte (Streak greift gar nicht).
 * - `correct=true`  → base zwischen 500 und 1000:
 *     base = round(1000 × (1 - 0.5 × elapsedRatio))
 *     elapsedRatio = min(elapsedMs / (timeLimit × 1000), 1)  ← Cap auf 1
 *   plus streakBonus(newStreak).
 *
 * Defensives Verhalten:
 * - Negatives `elapsedMs` (Clock-Skew, Test-Mocks) → behandelt wie 0.
 * - `timeLimitSeconds <= 0` (degenerate) → behandelt wie elapsedRatio 0
 *   (max base 1000), statt Division-by-Zero.
 *
 * @param correct          ist die Antwort richtig?
 * @param elapsedMs        verstrichene Zeit seit Frage-Start
 * @param timeLimitSeconds Limit der Frage (Standard 30s, konfigurierbar
 *                         über quiz_sessions.scoring_time_limit_s)
 * @param newStreak        Streak NACH dieser Antwort (also bei richtig +1,
 *                         bei falsch 0). Caller berechnet das vorher.
 * @returns ganze Zahl ≥ 0
 */
export function calculatePoints(
  correct: boolean,
  elapsedMs: number,
  timeLimitSeconds: number,
  newStreak: number
): number {
  if (!correct) {
    return 0;
  }
  const safeElapsed = Math.max(elapsedMs, 0);
  const safeLimitMs = Math.max(timeLimitSeconds, 0) * 1000;
  const elapsedRatio = safeLimitMs > 0 ? Math.min(safeElapsed / safeLimitMs, 1) : 0;
  const base = Math.round(1000 * (1 - 0.5 * elapsedRatio));
  return base + streakBonus(newStreak);
}
