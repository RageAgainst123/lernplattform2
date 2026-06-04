import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth/student-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { getActiveQuizSessionForClass, getRecentlyEndedQuizForClass } from '@/lib/db/quiz-sessions';
import { getQuestionProgress } from '@/lib/db/quiz-question-progress';
import { maybeAdvanceQuiz } from '@/lib/db/quiz-auto-advance';
import { rateLimitGate } from '@/lib/rate-limit';
import { moduleContentSchema, type Block } from '@/lib/schemas/blocks';

// Polling-Endpunkt für die Schüler:innen-Frage-Phase (Phase S2.B).
//
// Spec: docs/QUIZ-MODI-SPEZIFIKATION.md §5.4.
//
// Liefert pro Tick: aktuelle Frage (ohne correct-Flags!), countdown
// (server-seitig berechnet), answered/total counter, eigene Antwort-Info
// falls schon abgegeben. proxy.ts: /api/quiz aus updateSession()
// ausgenommen (siehe S1.C).
//
// classId IMMER aus jose-Session → kein IDOR.

export const dynamic = 'force-dynamic';

// Block ohne correct-Flag (geht ans Schüler:innen-Gerät — wir leaken
// niemals welche Option richtig ist).
export type SafeBlock =
  | {
      id: string;
      type: 'multiple_choice';
      question: string;
      options: { id: string; text: string }[];
    }
  | { id: string; type: 'true_false'; question: string }
  | { id: string; type: 'fill_blank'; text: string };

export type QuizQuestionState =
  | { kind: 'none' }
  | { kind: 'lobby'; sessionId: string }
  | { kind: 'between'; sessionId: string; lastQuestionIndex: number }
  | {
      kind: 'active';
      sessionId: string;
      questionIndex: number;
      block: SafeBlock;
      timeLimitSeconds: number;
      remainingSeconds: number;
      answered: number;
      total: number;
      ownAnswer: { isCorrect: boolean; points: number } | null;
    }
  // Phase S4: 5-Min-Fenster nach endQuizSession — Schüler:in sieht eigenen
  // End-Bildschirm (Rang + Punkte + Bilanz) BEVOR der Polling-Hook
  // automatisch zurück zu /s navigiert.
  | { kind: 'ended'; sessionId: string };

function noStore(state: QuizQuestionState): NextResponse {
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
}

// Entfernt correct-Flags vor dem Schicken ans Schüler:innen-Gerät.
function toSafeBlock(block: Block): SafeBlock | null {
  if (block.type === 'multiple_choice') {
    return {
      id: block.id,
      type: 'multiple_choice',
      question: block.question,
      options: block.options.map((o) => ({ id: o.id, text: o.text })),
    };
  }
  if (block.type === 'true_false') {
    return { id: block.id, type: 'true_false', question: block.question };
  }
  if (block.type === 'fill_blank') {
    return { id: block.id, type: 'fill_blank', text: block.text };
  }
  return null;
}

async function loadCurrentBlock(moduleId: string, blockId: string): Promise<Block | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('modules')
    .select('content')
    .eq('id', moduleId)
    .maybeSingle();
  if (!data?.content) return null;
  const parsed = moduleContentSchema.safeParse(data.content);
  if (!parsed.success) return null;
  return parsed.data.blocks.find((b) => b.id === blockId) ?? null;
}

function remainingSecondsFor(startedAt: string | null, limitSeconds: number): number {
  if (!startedAt) return limitSeconds;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(limitSeconds - elapsed, 0);
}

export async function GET(request: Request) {
  const blocked = rateLimitGate(request, 'quiz-question');
  if (blocked) return blocked;
  const session = await getStudentSession();
  if (!session) return noStore({ kind: 'none' });

  // Lazy-Auto-Reveal-Check (Spec §5.9 + §11.12): wenn alle geantwortet ODER
  // Zeit + 5s Karenz vorbei sind, schaltet maybeAdvanceQuiz die Session
  // sofort auf 'between_questions' (inkl. Backfill für die Verpasser:innen).
  // Idempotent + Race-frei. Der direkt folgende Lookup sieht dann die
  // aktualisierte Session.
  await maybeAdvanceQuiz(session.classId).catch(() => undefined);

  const quiz = await getActiveQuizSessionForClass(session.classId);
  if (!quiz) {
    const ended = await getRecentlyEndedQuizForClass(session.classId);
    if (ended) return noStore({ kind: 'ended', sessionId: ended.id });
    return noStore({ kind: 'none' });
  }

  if (quiz.status === 'lobby') {
    return noStore({ kind: 'lobby', sessionId: quiz.id });
  }
  if (quiz.status === 'between_questions') {
    return noStore({
      kind: 'between',
      sessionId: quiz.id,
      lastQuestionIndex: quiz.currentQuestionIndex,
    });
  }
  // status === 'active'
  return buildActiveResponse(quiz, session.studentCodeId);
}

async function buildActiveResponse(
  quiz: NonNullable<Awaited<ReturnType<typeof getActiveQuizSessionForClass>>>,
  studentCodeId: string
): Promise<NextResponse> {
  const ref = quiz.questionOrder[quiz.currentQuestionIndex];
  if (!ref) return noStore({ kind: 'none' });

  const rawBlock = await loadCurrentBlock(quiz.moduleId, ref.blockId);
  if (!rawBlock) return noStore({ kind: 'none' });
  const safeBlock = toSafeBlock(rawBlock);
  if (!safeBlock) return noStore({ kind: 'none' });

  const progress = await getQuestionProgress(quiz.id, quiz.currentQuestionIndex, studentCodeId);

  return noStore({
    kind: 'active',
    sessionId: quiz.id,
    questionIndex: quiz.currentQuestionIndex,
    block: safeBlock,
    timeLimitSeconds: quiz.timeLimitSeconds,
    remainingSeconds: remainingSecondsFor(quiz.currentQuestionStartedAt, quiz.timeLimitSeconds),
    answered: progress.answered,
    total: progress.total,
    ownAnswer: progress.ownAnswer,
  });
}
