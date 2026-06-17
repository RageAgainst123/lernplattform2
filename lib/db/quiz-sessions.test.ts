import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Heartbeat-Tod-Logik in getActiveQuizSessionForClass: Sessions ohne frisches
// Lebenszeichen (heartbeat_at > 120 s) gelten als tot (Spec §11 D10:
// Karenz von 120 s statt 60 s, weil Beamer-Tab WLAN-Aussetzer überleben soll).
//
// Pattern identisch zu live-sessions.test.ts.

const maybeSingle = vi.fn();

// `server-only` blockt sonst den Import des Service-Role-Lesepfads im jsdom-Test.
vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({ maybeSingle }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getActiveQuizSessionForClass } from '@/lib/db/quiz-sessions';

const baseRow = {
  id: 'qs1',
  class_id: 'c1',
  module_id: 'm1',
  mode: 'live_class' as const,
  status: 'active' as const,
  current_question_index: 2,
  current_question_started_at: '2026-05-31T11:59:50Z',
  time_limit_seconds: 30,
  scoring_time_limit_s: 30,
  team_mode: false,
  question_order: [{ blockId: 'b1', blockType: 'multiple_choice' }],
  due_date: null,
  show_leaderboard_between: true,
  shuffle_questions: false,
  shuffle_answers: true,
  started_at: '2026-05-31T11:59:30Z',
  ended_at: null,
  heartbeat_at: '2026-05-31T11:59:55Z', // 5 s alt → lebt
  created_at: '2026-05-31T11:59:30Z',
  updated_at: '2026-05-31T11:59:55Z',
};

describe('getActiveQuizSessionForClass — Heartbeat-Tod', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    maybeSingle.mockReset();
  });

  it('gibt die Session zurück, wenn der Heartbeat frisch ist', async () => {
    maybeSingle.mockResolvedValue({ data: baseRow });
    const result = await getActiveQuizSessionForClass('c1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('qs1');
    expect(result?.mode).toBe('live_class');
    expect(result?.status).toBe('active');
    expect(result?.currentQuestionIndex).toBe(2);
  });

  it('gibt null zurück, wenn die Session keine Heartbeat-Frische mehr hat', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...baseRow, heartbeat_at: '2026-05-31T11:57:00Z' }, // 3 min alt → tot
    });
    expect(await getActiveQuizSessionForClass('c1')).toBeNull();
  });

  it('gibt null zurück, wenn keine Session existiert', async () => {
    maybeSingle.mockResolvedValue({ data: null });
    expect(await getActiveQuizSessionForClass('c1')).toBeNull();
  });

  it('akzeptiert lobby-Status (vor dem ersten "Quiz starten")', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...baseRow, status: 'lobby', current_question_index: 0 },
    });
    const result = await getActiveQuizSessionForClass('c1');
    expect(result?.status).toBe('lobby');
  });

  it('akzeptiert between_questions-Status (Reveal/Leaderboard)', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...baseRow, status: 'between_questions' },
    });
    const result = await getActiveQuizSessionForClass('c1');
    expect(result?.status).toBe('between_questions');
  });

  it('liest Homework-Sessions mit due_date korrekt', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        ...baseRow,
        mode: 'homework',
        due_date: '2026-06-05T18:00:00Z',
      },
    });
    const result = await getActiveQuizSessionForClass('c1');
    expect(result?.mode).toBe('homework');
    expect(result?.dueDate).toBe('2026-06-05T18:00:00Z');
  });
});
