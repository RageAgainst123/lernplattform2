import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';

// Quiz-Tagespensum-Quota (Pre-Launch-C4, COST-CONTROLS.md L1.1).
//
// Schutz vor Missbrauch (Bot startet 1000 Quizzes/Tag) UND Bremse gegen
// virale Last-Spitzen. 20 Quiz-Starts pro Klasse pro Tag ist mehr als
// jede reale Schule braucht (typischerweise 1-3 pro Stunde, max 5-8
// am Tag). Wer mehr will, ist Missbrauch oder Test-Skript.
//
// Konfigurierbar via Env-Var QUIZ_DAILY_LIMIT_PER_CLASS (Default 20).
// 0 = unlimited (für Dev/Test).

const DEFAULT_LIMIT = 20;

function getLimit(): number {
  const env = process.env.QUIZ_DAILY_LIMIT_PER_CLASS;
  if (!env) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(env, 10);
  if (Number.isNaN(parsed) || parsed < 0) return DEFAULT_LIMIT;
  return parsed;
}

export type QuotaState = {
  used: number;
  limit: number;
  remaining: number;
  ok: boolean; // false wenn Limit erreicht
  // Schwellenwert für „warn"-UI (Banner): bei >= 80% Auslastung.
  warn: boolean;
};

// Liest die Anzahl der Quiz-Sessions für diese Klasse seit 00:00 lokaler
// Zeit (UTC-basiert für Konsistenz — Schul-Tage sind kein Edge-Case bei
// 20er-Limit). Idempotent + reine Lese-Query.
export async function checkQuizQuota(classId: string): Promise<QuotaState> {
  const limit = getLimit();
  if (limit === 0) {
    return { used: 0, limit: 0, remaining: Infinity, ok: true, warn: false };
  }
  const supabase = createServiceClient();
  // UTC-basiert: 00:00 UTC ≈ 01:00-02:00 lokal (AT). Für 20er-Limit egal.
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('quiz_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .gte('created_at', todayStart.toISOString());
  const used = count ?? 0;
  const remaining = Math.max(limit - used, 0);
  const ok = used < limit;
  const warn = limit > 0 && used / limit >= 0.8;
  return { used, limit, remaining, ok, warn };
}

// User-freundliche Fehlermeldung wenn Quota überschritten. Wird in
// createQuizSession in den error-Return gestellt.
export const QUOTA_EXCEEDED_MESSAGE =
  'Tages-Quiz-Limit erreicht — geht morgen ab 00:00 Uhr UTC wieder. Wer mehr braucht, bitte melden.';
