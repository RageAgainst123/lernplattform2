import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Server Actions für Schüler:innen-Beitritt zu einer Quiz-Session.
// Service-Role-Schreibpfad: keine RLS, Sicherheit über jose-Session
// (studentCodeId + classId kommen NIE aus Client-Param).

vi.mock('server-only', () => ({}));

const upsertMock = vi.fn();
const sessionMaybeSingle = vi.fn();
const codeMaybeSingle = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({ from: fromMock }),
}));

vi.mock('@/lib/auth/student-auth', () => ({
  requireStudentSession: vi.fn(async () => ({
    studentCodeId: 'sc-1',
    classId: 'c1',
  })),
}));

// Phase T2: Broadcast als hoisted-Mock — Tests prüfen dass
// participant_joined publisht wird.
const { publishBroadcastMock } = vi.hoisted(() => ({
  publishBroadcastMock: vi.fn(async () => 'ok'),
}));
vi.mock('@/lib/realtime/broadcast', () => ({
  publishBroadcast: publishBroadcastMock,
}));

beforeEach(() => {
  upsertMock.mockReset();
  sessionMaybeSingle.mockReset();
  codeMaybeSingle.mockReset();
  fromMock.mockReset();
  publishBroadcastMock.mockClear();

  // Sessions-Lookup: getActiveQuizSessionForClass-Pattern
  const sessionsBuilder = {
    select: () => ({
      eq: () => ({
        in: () => ({ maybeSingle: sessionMaybeSingle }),
      }),
    }),
  };
  // student_codes-Lookup für Codename
  const codesBuilder = {
    select: () => ({
      eq: () => ({ maybeSingle: codeMaybeSingle }),
    }),
  };
  // quiz_participants-Upsert
  const participantsBuilder = {
    upsert: upsertMock,
  };

  fromMock.mockImplementation((table: string) => {
    if (table === 'quiz_sessions') return sessionsBuilder;
    if (table === 'student_codes') return codesBuilder;
    if (table === 'quiz_participants') return participantsBuilder;
    throw new Error(`Unexpected table ${table}`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

import { joinQuizSession } from '@/lib/db/quiz-participant-actions';

const baseSession = {
  id: 'qs1',
  status: 'lobby',
  team_mode: false,
  heartbeat_at: new Date().toISOString(),
  mode: 'live_class',
};

describe('joinQuizSession', () => {
  it('upsertet einen Teilnehmer mit Codename als display_name', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: baseSession });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({ error: null });

    const res = await joinQuizSession();
    expect(res.error).toBeNull();
    expect(res.sessionId).toBe('qs1');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'qs1',
        student_code_id: 'sc-1',
        display_name: '5T-01',
        team_name: null,
      }),
      expect.objectContaining({ onConflict: 'session_id,student_code_id' })
    );
  });

  it('lehnt ab wenn keine aktive Session existiert', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: null });
    const res = await joinQuizSession();
    expect(res.sessionId).toBeNull();
    expect(res.error).toMatch(/kein.*quiz/i);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('setzt team_name wenn Team-Modus aktiv ist', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: { ...baseSession, team_mode: true } });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({ error: null });

    const res = await joinQuizSession({ teamName: 'Codeknacker' });
    expect(res.error).toBeNull();
    const payload = upsertMock.mock.calls[0]?.[0] as { team_name: string | null };
    expect(payload.team_name).toBe('Codeknacker');
  });

  it('lehnt leeren Teamnamen im Team-Modus ab', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: { ...baseSession, team_mode: true } });
    const res = await joinQuizSession({ teamName: '   ' });
    expect(res.sessionId).toBeNull();
    expect(res.error).toMatch(/teamname/i);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('trimmt Teamnamen und cappt auf 40 Zeichen', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: { ...baseSession, team_mode: true } });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({ error: null });

    const longName = '  ' + 'X'.repeat(60) + '  ';
    await joinQuizSession({ teamName: longName });
    const payload = upsertMock.mock.calls[0]?.[0] as { team_name: string };
    expect(payload.team_name).toHaveLength(40);
    expect(payload.team_name.startsWith('X')).toBe(true);
  });

  it('liefert freundlichen Fehler bei DB-Unique-Conflict (Teamname vergeben)', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: { ...baseSession, team_mode: true } });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({
      error: { message: 'duplicate key value violates unique constraint', code: '23505' },
    });

    const res = await joinQuizSession({ teamName: 'Codeknacker' });
    expect(res.sessionId).toBeNull();
    expect(res.error).toMatch(/teamname.*vergeben/i);
  });

  it('publisht participant_joined nach erfolgreichem Upsert (Phase T2)', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: baseSession });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({ error: null });

    await joinQuizSession();
    expect(publishBroadcastMock).toHaveBeenCalledWith(
      'quiz_session:qs1',
      'participant_joined',
      expect.objectContaining({ displayName: '5T-01' })
    );
  });

  it('publisht KEIN Event wenn Upsert failed', async () => {
    sessionMaybeSingle.mockResolvedValue({ data: baseSession });
    codeMaybeSingle.mockResolvedValue({ data: { codename: '5T-01' } });
    upsertMock.mockResolvedValue({ error: { code: '23505', message: 'dup' } });

    await joinQuizSession();
    expect(publishBroadcastMock).not.toHaveBeenCalled();
  });
});
