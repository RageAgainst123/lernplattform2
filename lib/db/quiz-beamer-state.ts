import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { moduleContentSchema, type Block } from '@/lib/schemas/blocks';

// Beamer-State für die Lehrer:innen-Frage-Phase (Phase S2.C).
//
// Liefert die VOLLE Frage (inkl. correct-Flags — Lehrer:in darf sehen)
// plus Antwort-Verteilung pro Option für den Reveal-Bildschirm.
//
// Service-Role: Aggregation über quiz_answers/quiz_participants. Die
// Lehrer:innen-Autorisierung läuft auf API-Ebene (User-Client + Klassen-
// Owner-Check) — hier wird nur gelesen was angefordert wird.

export type AnswerDistributionEntry = {
  // Option-ID für MC, true/false-string für T/F, getrimmte Solution für
  // fill_blank. Bei MC mit mehreren correct entsteht ein eintrag pro
  // gewählter Kombination (JSON-stringified).
  key: string;
  count: number;
};

export type QuizBeamerQuestionState = {
  questionIndex: number;
  block: Block; // mit correct-Flags
  timeLimitSeconds: number;
  remainingSeconds: number;
  answered: number;
  total: number;
  distribution: AnswerDistributionEntry[];
  correctRate: number; // 0..1 — Anteil richtiger Antworten
};

// Liest den Modul-Block frisch + zählt alle Antworten für diesen Frage-
// Index. Distribution wird über serialisierte Antwort-Werte gruppiert
// (JSON-stringified — für MC mit Set-Charakter kein Problem).
export async function getQuizBeamerQuestionState(
  sessionId: string,
  moduleId: string,
  blockId: string,
  questionIndex: number,
  timeLimitSeconds: number,
  startedAt: string | null
): Promise<QuizBeamerQuestionState | null> {
  const supabase = createServiceClient();
  const [modRes, ansRes, totRes] = await Promise.all([
    supabase.from('modules').select('content').eq('id', moduleId).maybeSingle(),
    supabase
      .from('quiz_answers')
      .select('answer, is_correct')
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex),
    supabase
      .from('quiz_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId),
  ]);
  if (!modRes.data?.content) return null;
  const parsed = moduleContentSchema.safeParse(modRes.data.content);
  if (!parsed.success) return null;
  const block = parsed.data.blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const answers = (ansRes.data ?? []) as { answer: unknown; is_correct: boolean }[];
  const distribution = buildDistribution(answers);
  const correctCount = answers.filter((a) => a.is_correct).length;
  const correctRate = answers.length > 0 ? correctCount / answers.length : 0;

  return {
    questionIndex,
    block,
    timeLimitSeconds,
    remainingSeconds: remainingSecondsFor(startedAt, timeLimitSeconds),
    answered: answers.length,
    total: totRes.count ?? 0,
    distribution,
    correctRate,
  };
}

function buildDistribution(answers: { answer: unknown }[]): AnswerDistributionEntry[] {
  const counts = new Map<string, number>();
  for (const row of answers) {
    const key = keyFor(row.answer);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

// Serialisiert eine Antwort zu einem Verteilungs-Key. MC-Antworten
// (string[]) werden sortiert, damit ['a','b'] und ['b','a'] denselben
// Key haben. true/false → 'true'/'false'. Sonst JSON.stringify als
// Fallback (sollte selten passieren).
function keyFor(answer: unknown): string {
  if (Array.isArray(answer)) {
    return JSON.stringify([...answer].sort());
  }
  if (typeof answer === 'boolean') return String(answer);
  if (typeof answer === 'string') return answer.trim().toLowerCase();
  return JSON.stringify(answer);
}

function remainingSecondsFor(startedAt: string | null, limitSeconds: number): number {
  if (!startedAt) return limitSeconds;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(limitSeconds - elapsed, 0);
}
