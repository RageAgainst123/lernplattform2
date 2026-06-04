import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Server Actions für Quiz-Sessions (Lehrer:innen-Steuerung, Phase S).
// Mock-Tests für die RPC- und Update-Pfade. Pattern wie live-vote-actions.test.ts.

vi.mock('server-only', () => ({}));

const rpcMock = vi.fn();
const updateMock = vi.fn();
const selectMock = vi.fn();
// Phase T2: nach update().eq().eq() folgt manchmal .select('id').maybeSingle()
// (für Broadcast-Trigger). Per Default liefert dieser Pfad eine simulierte
// Session-Id zurück, damit publishBroadcast in den happy-path-Tests
// aufgerufen wird. Tests können updateSelectMaybeSingleMock überschreiben.
type UpdateSelectResult = {
  data: { id: string; current_question_index: number } | null;
  error: null;
};
const updateSelectMaybeSingleMock = vi.fn<() => Promise<UpdateSelectResult>>();
updateSelectMaybeSingleMock.mockImplementation(async () => ({
  data: { id: 'sess-1', current_question_index: 0 },
  error: null,
}));
const updateSelectChain = {
  maybeSingle: updateSelectMaybeSingleMock,
};
// Filter-Methoden geben sich selbst zurück (chainable + awaitable als
// Promise<{error: null}>). So funktionieren beliebige .eq().in().eq()-Ketten.
// .select(...) öffnet die Post-Update-Subchain für Broadcast-Reads.
const filterChain = {
  eq: vi.fn(),
  in: vi.fn(),
  select: vi.fn(() => updateSelectChain),
  then(resolve: (v: { error: null }) => unknown) {
    return Promise.resolve({ error: null }).then(resolve);
  },
};
filterChain.eq.mockImplementation(() => filterChain);
filterChain.in.mockImplementation(() => filterChain);

// Select-Chain liefert per Default null zurück (= keine laufende Session
// gefunden → Backfill wird übersprungen). Tests können selectMock
// überschreiben falls sie eine Session simulieren wollen.
type SelectChainResult = {
  data: null | {
    id: string;
    status: string;
    current_question_index: number;
    question_order: { blockId: string }[];
  };
  error: null;
};
const selectChain = {
  eq: vi.fn(),
  in: vi.fn(),
  maybeSingle: vi.fn<() => Promise<SelectChainResult>>(),
};
selectChain.maybeSingle.mockImplementation(async () => ({ data: null, error: null }));
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

// quiz-quota nutzt Service-Role direkt. Default: alles ok, lassen Tests
// die Quota selbst überschreiben falls sie sie testen wollen.
vi.mock('@/lib/db/quiz-quota', () => ({
  checkQuizQuota: vi.fn(async () => ({
    used: 0,
    limit: 20,
    remaining: 20,
    ok: true,
    warn: false,
  })),
  QUOTA_EXCEEDED_MESSAGE: 'Quota überschritten',
}));

vi.mock('@/lib/auth/teacher-auth', () => ({
  requireUser: vi.fn(async () => ({ id: 'teacher-1', email: 'g@x.at' })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Phase T2: Broadcast-Helper mocken — fire-and-forget, Tests prüfen nur
// dass die richtigen Events publisht werden (siehe describe('broadcasts')).
// vi.hoisted, weil vi.mock zur Compile-Zeit oben angeführt wird und
// publishBroadcastMock NACH dem Hoisted-vi.mock initialisiert wäre.
const { publishBroadcastMock } = vi.hoisted(() => ({
  publishBroadcastMock: vi.fn(async () => 'ok'),
}));
vi.mock('@/lib/realtime/broadcast', () => ({
  publishBroadcast: publishBroadcastMock,
}));

beforeEach(() => {
  rpcMock.mockReset();
  updateMock.mockReset();
  selectMock.mockReset();
  publishBroadcastMock.mockClear();
  filterChain.eq.mockClear();
  filterChain.in.mockClear();
  filterChain.select.mockClear();
  filterChain.eq.mockImplementation(() => filterChain);
  filterChain.in.mockImplementation(() => filterChain);
  filterChain.select.mockImplementation(() => updateSelectChain);
  updateSelectMaybeSingleMock.mockReset();
  updateSelectMaybeSingleMock.mockImplementation(async () => ({
    data: { id: 'sess-1', current_question_index: 0 },
    error: null,
  }));
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
  revealQuizQuestion,
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

describe('broadcasts (Phase T2)', () => {
  it('startQuiz publisht question_started auf quiz_session:{id}', async () => {
    await startQuiz('c1');
    expect(publishBroadcastMock).toHaveBeenCalledWith(
      'quiz_session:sess-1',
      'question_started',
      expect.objectContaining({ questionIndex: 0 })
    );
  });

  it('revealQuizQuestion publisht question_revealed', async () => {
    updateSelectMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'sess-2', current_question_index: 3 },
      error: null,
    });
    await revealQuizQuestion('c1');
    expect(publishBroadcastMock).toHaveBeenCalledWith(
      'quiz_session:sess-2',
      'question_revealed',
      expect.objectContaining({ questionIndex: 3 })
    );
  });

  it('endQuizSession publisht quiz_ended wenn Session existiert', async () => {
    // endQuizSession liest erst die Session per select-Chain (selectChain).
    // Simulieren wir eine aktive Session.
    selectChain.maybeSingle.mockImplementationOnce(async () => ({
      data: {
        id: 'sess-end',
        status: 'active',
        current_question_index: 1,
        question_order: [{ blockId: 'b1' }, { blockId: 'b2' }],
      },
      error: null,
    }));
    await endQuizSession('c1');
    expect(publishBroadcastMock).toHaveBeenCalledWith(
      'quiz_session:sess-end',
      'quiz_ended',
      expect.anything()
    );
  });

  it('startQuiz schluckt fehlende Session leise (kein Broadcast)', async () => {
    updateSelectMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const res = await startQuiz('c1');
    expect(res.error).toBeNull();
    expect(publishBroadcastMock).not.toHaveBeenCalled();
  });
});
