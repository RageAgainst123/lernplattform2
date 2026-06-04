import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Server Actions für Quiz-Sessions (Lehrer:innen-Steuerung, Phase S).
// Mock-Tests für die RPC- und Update-Pfade. Pattern wie live-vote-actions.test.ts.

vi.mock('server-only', () => ({}));

const rpcMock = vi.fn();
const updateMock = vi.fn();
const selectMock = vi.fn();
// Filter-Methoden geben sich selbst zurück (chainable + awaitable als
// Promise<{error: null}>). So funktionieren beliebige .eq().in().eq()-Ketten.
const filterChain = {
  eq: vi.fn(),
  in: vi.fn(),
  then(resolve: (v: { error: null }) => unknown) {
    return Promise.resolve({ error: null }).then(resolve);
  },
};
filterChain.eq.mockImplementation(() => filterChain);
filterChain.in.mockImplementation(() => filterChain);

// Select-Chain liefert per Default null zurück (= keine laufende Session
// gefunden → Backfill wird übersprungen). Tests können selectMock
// überschreiben falls sie eine Session simulieren wollen.
const selectChain = {
  eq: vi.fn(),
  in: vi.fn(),
  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
};
selectChain.eq.mockImplementation(() => selectChain);
selectChain.in.mockImplementation(() => selectChain);
selectMock.mockImplementation(() => selectChain);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    rpc: rpcMock,
    from: vi.fn(() => ({
      update: updateMock,
      select: selectMock,
    })),
  })),
}));

// quiz-end-backfill nutzt Service-Role direkt. Wir mocken es als Pure-NoOp,
// damit endQuizSession in den Tests nicht in die echte Backfill-Logik
// reinläuft (die ist in quiz-end-backfill.test.ts separat getestet).
vi.mock('@/lib/db/quiz-end-backfill', () => ({
  backfillPendingAnswers: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/teacher-auth', () => ({
  requireUser: vi.fn(async () => ({ id: 'teacher-1', email: 'g@x.at' })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  rpcMock.mockReset();
  updateMock.mockReset();
  selectMock.mockReset();
  filterChain.eq.mockClear();
  filterChain.in.mockClear();
  filterChain.eq.mockImplementation(() => filterChain);
  filterChain.in.mockImplementation(() => filterChain);
  updateMock.mockImplementation(() => filterChain);
  selectChain.eq.mockClear();
  selectChain.in.mockClear();
  selectChain.maybeSingle.mockClear();
  selectChain.eq.mockImplementation(() => selectChain);
  selectChain.in.mockImplementation(() => selectChain);
  selectChain.maybeSingle.mockImplementation(async () => ({ data: null, error: null }));
  selectMock.mockImplementation(() => selectChain);
});

afterEach(() => {
  vi.restoreAllMocks();
});

import {
  createQuizSession,
  startQuiz,
  endQuizSession,
  heartbeatQuizSession,
} from '@/lib/db/quiz-session-actions';

describe('createQuizSession', () => {
  it('ruft RPC start_quiz_session mit den gegebenen Settings', async () => {
    rpcMock.mockResolvedValue({ data: 'new-session-id', error: null });
    const res = await createQuizSession({
      classId: 'c1',
      moduleId: 'm1',
      mode: 'live_class',
      questionOrder: [{ blockId: 'b1', blockType: 'multiple_choice' }],
      settings: {
        timeLimitSeconds: 30,
        scoringTimeLimitS: 30,
        teamMode: false,
        showLeaderboardBetween: true,
        shuffleQuestions: false,
        shuffleAnswers: true,
        dueDate: null,
      },
    });
    expect(res.error).toBeNull();
    expect(res.sessionId).toBe('new-session-id');
    expect(rpcMock).toHaveBeenCalledWith(
      'start_quiz_session',
      expect.objectContaining({
        p_class: 'c1',
        p_module: 'm1',
        p_mode: 'live_class',
        p_time_limit_seconds: 30,
        p_team_mode: false,
      })
    );
  });

  it('liefert freundliche Fehlermeldung bei live_session_active', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'live_session_active', code: 'P0001' },
    });
    const res = await createQuizSession({
      classId: 'c1',
      moduleId: 'm1',
      mode: 'live_class',
      questionOrder: [{ blockId: 'b1', blockType: 'multiple_choice' }],
      settings: {
        timeLimitSeconds: 30,
        scoringTimeLimitS: 30,
        teamMode: false,
        showLeaderboardBetween: true,
        shuffleQuestions: false,
        shuffleAnswers: true,
        dueDate: null,
      },
    });
    expect(res.sessionId).toBeNull();
    expect(res.error).toMatch(/präsentation/i);
  });

  it('lehnt leere question_order ab', async () => {
    const res = await createQuizSession({
      classId: 'c1',
      moduleId: 'm1',
      mode: 'live_class',
      questionOrder: [],
      settings: {
        timeLimitSeconds: 30,
        scoringTimeLimitS: 30,
        teamMode: false,
        showLeaderboardBetween: true,
        shuffleQuestions: false,
        shuffleAnswers: true,
        dueDate: null,
      },
    });
    expect(res.sessionId).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(res.error).toMatch(/keine bewertbaren fragen/i);
  });
});

describe('startQuiz', () => {
  it('setzt status auf active und current_question_started_at', async () => {
    const res = await startQuiz('c1');
    expect(res.error).toBeNull();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        current_question_index: 0,
      })
    );
    expect(filterChain.eq).toHaveBeenCalledWith('class_id', 'c1');
    expect(filterChain.eq).toHaveBeenCalledWith('status', 'lobby');
  });
});

describe('endQuizSession', () => {
  it('setzt status auf ended', async () => {
    const res = await endQuizSession('c1');
    expect(res.error).toBeNull();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ended',
      })
    );
  });
});

describe('heartbeatQuizSession', () => {
  it('aktualisiert heartbeat_at auf einen ISO-Timestamp', async () => {
    await heartbeatQuizSession('c1');
    const payload = updateMock.mock.calls[0]?.[0] as { heartbeat_at: string };
    expect(payload.heartbeat_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
