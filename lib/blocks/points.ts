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

/**
 * Phase W (2026-06): Penalty-Faktor für Mehrfachversuch-Blöcke.
 *
 * Wenn eine Frage `maxAttempts > 1` erlaubt, darf Schüler:in bei
 * falscher Antwort einen Hinweis sehen und es erneut probieren. Pro
 * Versuch -25 % Punkte:
 *   1. Versuch → 1.00 (volle Punkte)
 *   2. Versuch → 0.75
 *   3. Versuch → 0.50
 *   4. Versuch → 0.25
 *   5+        → 0.00 (Floor — keine negativen Punkte)
 *
 * Bei `attemptCount=0` (= „noch nie geantwortet") und falscher
 * Antwort: 0. Bei `attemptCount=1` und richtig: 1.00.
 *
 * Diese Funktion ist UI-Helper, der Multiplikator wird auf den
 * Basis-Score (z.B. `gradeBlock()` → 0/1) angewendet, um den
 * effektiven Block-Score zu bekommen. Für Live-Quiz-Punkte wird
 * dieser Faktor auch in `calculatePoints()` einfließen können
 * (siehe Phase X/AA).
 *
 * @param attemptCount Anzahl Versuche, die Schüler:in gemacht hat (1-basiert).
 *                     1 = erster Versuch, 2 = nach 1× falsch, etc.
 * @returns Faktor zwischen 0 und 1 (0 = keine Punkte mehr).
 */
export function attemptPenalty(attemptCount: number): number {
  if (attemptCount < 1) return 0;
  const factor = 1 - 0.25 * (attemptCount - 1);
  return Math.max(0, factor);
}

/**
 * Wendet den Mehrfachversuch-Penalty auf einen Basis-Score an.
 * Konvenienz-Wrapper für die häufige Kombination basePoints × attemptPenalty.
 *
 * @param basePoints  Basis-Score (z.B. 0 oder 1 aus gradeBlock())
 * @param attemptCount Anzahl Versuche (1-basiert)
 * @returns Effektive Punkte (gerundet auf 2 Nachkommastellen)
 */
export function scoreWithAttempts(basePoints: number, attemptCount: number): number {
  const raw = basePoints * attemptPenalty(attemptCount);
  return Math.round(raw * 100) / 100;
}
