import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// submitTextVote: trim, max 40 Zeichen, leeren Text ablehnen, Lock-Guard.
// Tests stubben getStudentSession + getActiveSessionForClass + Service-Client.

const upsert = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({ from: () => ({ upsert }) }),
}));

const getStudentSession = vi.fn();
vi.mock('@/lib/auth/student-auth', () => ({
  getStudentSession: () => getStudentSession(),
}));

const getActiveSessionForClass = vi.fn();
vi.mock('@/lib/db/live-sessions', () => ({
  getActiveSessionForClass: () => getActiveSessionForClass(),
}));

import { submitTextVote } from '@/lib/db/live-vote-actions';

describe('submitTextVote', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null });
    getStudentSession.mockReset();
    getActiveSessionForClass.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lehnt ab, wenn nicht angemeldet', async () => {
    getStudentSession.mockResolvedValue(null);
    const res = await submitTextVote('b1', 'hallo');
    expect(res.error).toBe('Nicht angemeldet.');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('lehnt leeren Text (auch nach trim) ab', async () => {
    getStudentSession.mockResolvedValue({ classId: 'c', studentCodeId: 'sc' });
    getActiveSessionForClass.mockResolvedValue({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    const res = await submitTextVote('b1', '   ');
    expect(res.error).toBe('Bitte gib einen Text ein.');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('lehnt ab, wenn keine Session läuft', async () => {
    getStudentSession.mockResolvedValue({ classId: 'c', studentCodeId: 'sc' });
    getActiveSessionForClass.mockResolvedValue(null);
    const res = await submitTextVote('b1', 'hallo');
    expect(res.error).toBe('Gerade läuft keine Präsentation.');
  });

  it('lehnt ab, wenn Abstimmung gesperrt ist (Lock-Guard)', async () => {
    getStudentSession.mockResolvedValue({ classId: 'c', studentCodeId: 'sc' });
    getActiveSessionForClass.mockResolvedValue({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: true,
    });
    const res = await submitTextVote('b1', 'hallo');
    expect(res.error).toBe('Die Abstimmung ist bereits geschlossen.');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('kürzt auf 40 Zeichen und speichert mit free_text + option_id null', async () => {
    getStudentSession.mockResolvedValue({ classId: 'c', studentCodeId: 'sc' });
    getActiveSessionForClass.mockResolvedValue({
      id: 's1',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    const long = 'a'.repeat(80);
    const res = await submitTextVote('b1', `   ${long}   `);
    expect(res.error).toBeNull();
    expect(upsert).toHaveBeenCalledTimes(1);
    const [payload] = upsert.mock.calls[0];
    expect(payload).toEqual({
      session_id: 's1',
      block_id: 'b1',
      option_id: null,
      free_text: 'a'.repeat(40),
      student_code_id: 'sc',
    });
  });
});
