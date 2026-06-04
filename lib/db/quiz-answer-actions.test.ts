import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Server Action submitQuizAnswer: bewertet die Antwort einer Schüler:in
// auf die aktuell aktive Quiz-Frage. Mockt den Supabase-Service-Client
// + jose-Session.
//
// Spec: docs/QUIZ-MODI-SPEZIFIKATION.md §5.4 (Frage-Phase).

vi.mock('server-only', () => ({}));

// Supabase-Service-Mock: from(table) → { ... }
const sessionMaybeSingle = vi.fn();
const moduleMaybeSingle = vi.fn();
const participantMaybeSingle = vi.fn();
const answerInsert = vi.fn();
const participantUpdate = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({ from: fromMock }),
}));

vi.mock('@/lib/auth/student-auth', () => ({
  requireStudentSession: vi.fn(async () => ({
    studentCodeId: 'sc-1',
    classId: 'c-1',
  })),
}));

const SESSION_ID = 'qs-1';
const MODULE_ID = 'm-1';

const baseSession = {
  id: SESSION_ID,
  module_id: MODULE_ID,
  status: 'active',
  current_question_index: 0,
  current_question_started_at: '2026-05-31T11:59:55Z', // 5s vor "jetzt"
  time_limit_seconds: 30,
  scoring_time_limit_s: 30,
  team_mode: false,
  question_order: [{ blockId: 'q1', blockType: 'multiple_choice' }],
};

const moduleContent = {
  blocks: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'Wofür steht EVA?',
      options: [
        { id: 'a', text: 'Eingabe-Verarbeitung-Ausgabe', correct: true },
        { id: 'b', text: 'Etwas-Ganz-Anderes', correct: false },
      ],
    },
  ],
};

const baseParticipant = {
  session_id: SESSION_ID,
  student_code_id: 'sc-1',
  total_points: 0,
  current_streak: 0,
  longest_streak: 0,
  correct_count: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));

  sessionMaybeSingle.mockReset();
  moduleMaybeSingle.mockReset();
  participantMaybeSingle.mockReset();
  answerInsert.mockReset();
  participantUpdate.mockReset();
  fromMock.mockReset();

  // Default: session aktiv, modul vorhanden, participant existiert, insert ok,
  // update ok. Tests überschreiben einzeln.
  sessionMaybeSingle.mockResolvedValue({ data: baseSession });
  moduleMaybeSingle.mockResolvedValue({ data: { content: moduleContent } });
  participantMaybeSingle.mockResolvedValue({ data: baseParticipant });
  answerInsert.mockResolvedValue({ error: null });

  const updateEq2 = vi.fn().mockResolvedValue({ error: null });
  const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
  participantUpdate.mockImplementation(() => ({ eq: updateEq1 }));

  fromMock.mockImplementation((table: string) => {
    if (table === 'quiz_sessions') {
      return {
        select: () => ({
          eq: () => ({ in: () => ({ maybeSingle: sessionMaybeSingle }) }),
        }),
      };
    }
    if (table === 'modules') {
      return {
        select: () => ({ eq: () => ({ maybeSingle: moduleMaybeSingle }) }),
      };
    }
    if (table === 'quiz_participants') {
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: participantMaybeSingle }) }),
        }),
        update: participantUpdate,
      };
    }
    if (table === 'quiz_answers') {
      return { insert: answerInsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

import { submitQuizAnswer } from '@/lib/db/quiz-answer-actions';

describe('submitQuizAnswer — happy path', () => {
  it('akzeptiert eine richtige MC-Antwort und vergibt punkte', async () => {
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toBeNull();
    expect(res.points).toBeGreaterThan(900); // ~917 bei 5s/30s
    expect(res.isCorrect).toBe(true);
    expect(answerInsert).toHaveBeenCalled();
    const insertPayload = answerInsert.mock.calls[0][0] as {
      session_id: string;
      student_code_id: string;
      question_index: number;
      is_correct: boolean;
      points_awarded: number;
    };
    expect(insertPayload.session_id).toBe(SESSION_ID);
    expect(insertPayload.is_correct).toBe(true);
    expect(insertPayload.points_awarded).toBeGreaterThan(900);
  });

  it('falsche Antwort = 0 Punkte, streak reset', async () => {
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['b'],
    });
    expect(res.error).toBeNull();
    expect(res.isCorrect).toBe(false);
    expect(res.points).toBe(0);
  });

  it('streak-bonus bei 3 richtigen in folge', async () => {
    participantMaybeSingle.mockResolvedValue({
      data: { ...baseParticipant, current_streak: 2 },
    });
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toBeNull();
    // base ~917 + 100 streak-bonus = ~1017
    expect(res.points).toBeGreaterThan(1000);
  });
});

describe('submitQuizAnswer — validation', () => {
  it('STALE_QUESTION wenn session nicht aktiv', async () => {
    sessionMaybeSingle.mockResolvedValue({
      data: { ...baseSession, status: 'between_questions' },
    });
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toMatch(/zu spät|stale|nicht.*aktiv/i);
    expect(answerInsert).not.toHaveBeenCalled();
  });

  it('STALE_QUESTION wenn question_index abweicht', async () => {
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 1, // session ist bei 0
      answer: ['a'],
    });
    expect(res.error).toMatch(/zu spät|stale|frage/i);
    expect(answerInsert).not.toHaveBeenCalled();
  });

  it('lehnt ab wenn keine session existiert', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: null });
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toMatch(/quiz/i);
    expect(answerInsert).not.toHaveBeenCalled();
  });

  it('lehnt ab wenn block_id nicht im Modul existiert', async () => {
    moduleMaybeSingle.mockResolvedValue({
      data: { content: { blocks: [{ id: 'andere', type: 'text', content: 'x' }] } },
    });
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toMatch(/frage/i);
    expect(answerInsert).not.toHaveBeenCalled();
  });
});

describe('submitQuizAnswer — Doppel-Submit', () => {
  it('liefert freundlichen Fehler bei UNIQUE-Constraint-Violation (23505)', async () => {
    answerInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key' },
    });
    const res = await submitQuizAnswer({
      sessionId: SESSION_ID,
      questionIndex: 0,
      answer: ['a'],
    });
    expect(res.error).toMatch(/bereits|schon/i);
  });
});
