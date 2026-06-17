import { beforeEach, describe, expect, it, vi } from 'vitest';

// V5: getModuleProgressCount — Count-Query auf student_progress via
// Service-Role (Editor-Warn-Banner). Mock-Pattern wie class-topics.test.ts.

vi.mock('server-only', () => ({}));

type CountResponse = { count: number | null; error: { message: string } | null };
let response: CountResponse = { count: null, error: null };

const eqMock = vi.fn(() => Promise.resolve(response));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({ from: fromMock })),
}));

import { getModuleProgressCount } from '@/lib/db/modules';

beforeEach(() => {
  vi.clearAllMocks();
  response = { count: null, error: null };
});

describe('getModuleProgressCount (V5)', () => {
  it('liefert die Anzahl Schüler:innen mit Fortschritt', async () => {
    response = { count: 7, error: null };
    expect(await getModuleProgressCount('mod-1')).toBe(7);
    expect(fromMock).toHaveBeenCalledWith('student_progress');
    expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(eqMock).toHaveBeenCalledWith('module_id', 'mod-1');
  });

  it('liefert 0 wenn count null ist (kein Fortschritt)', async () => {
    response = { count: null, error: null };
    expect(await getModuleProgressCount('mod-1')).toBe(0);
  });

  it('wirft bei DB-Fehler', async () => {
    response = { count: null, error: { message: 'kaputt' } };
    await expect(getModuleProgressCount('mod-1')).rejects.toThrow('kaputt');
  });
});
