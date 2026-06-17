import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Heartbeat-Tod-Logik in getActiveSessionForClass: Sessions ohne frisches
// Lebenszeichen (updated_at > 60 s) oder zu alt (created_at > 4 h) gelten als tot.

const maybeSingle = vi.fn();

// `server-only` blockt sonst den Import des Service-Role-Lesepfads im jsdom-Test.
vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getActiveSessionForClass } from '@/lib/db/live-sessions';

describe('getActiveSessionForClass — Heartbeat-Tod', () => {
  beforeEach(() => {
    // Feste „Jetzt"-Zeit für deterministische Altersberechnung.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    maybeSingle.mockReset();
  });

  it('gibt die Session zurück, wenn der Heartbeat frisch ist', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 's1',
        module_id: 'm1',
        current_block_index: 2,
        current_block_locked: false,
        created_at: '2026-05-31T11:59:30Z',
        updated_at: '2026-05-31T11:59:50Z', // 10 s alt → lebt
      },
    });
    expect(await getActiveSessionForClass('c1')).toEqual({
      id: 's1',
      moduleId: 'm1',
      currentBlockIndex: 2,
      locked: false,
    });
  });

  it('gibt null zurück, wenn der Heartbeat älter als 60 s ist (toter Beamer)', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 's1',
        module_id: 'm1',
        current_block_index: 0,
        created_at: '2026-05-31T11:55:00Z', // frisch genug fürs 4-h-Netz
        updated_at: '2026-05-31T11:58:30Z', // 90 s alt → tot
      },
    });
    expect(await getActiveSessionForClass('c1')).toBeNull();
  });

  it('gibt null zurück, wenn die Session älter als 4 h ist', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 's1',
        module_id: 'm1',
        current_block_index: 0,
        created_at: '2026-05-31T07:00:00Z', // 5 h alt
        updated_at: '2026-05-31T11:59:55Z', // Heartbeat frisch, trotzdem zu alt
      },
    });
    expect(await getActiveSessionForClass('c1')).toBeNull();
  });

  it('gibt null zurück, wenn keine aktive Session existiert', async () => {
    maybeSingle.mockResolvedValue({ data: null });
    expect(await getActiveSessionForClass('c1')).toBeNull();
  });
});
