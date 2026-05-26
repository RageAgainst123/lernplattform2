import { beforeEach, describe, expect, it, vi } from 'vitest';

// Verkettbarer Supabase-Query-Mock: from().select().order() / .eq().maybeSingle()
const orderMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ order: orderMock, eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
}));

import { getClass, getClasses } from '@/lib/db/classes';

const row = {
  id: 'c-1',
  teacher_id: 'u-1',
  name: '5A 2026/27',
  schulstufe: 5,
  created_at: '2026-05-25T00:00:00Z',
  updated_at: '2026-05-25T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getClasses', () => {
  it('maps DB rows to Class objects (snake_case → camelCase)', async () => {
    orderMock.mockResolvedValue({ data: [row], error: null });
    const result = await getClasses();
    expect(result).toEqual([
      {
        id: 'c-1',
        teacherId: 'u-1',
        name: '5A 2026/27',
        schulstufe: 5,
        createdAt: '2026-05-25T00:00:00Z',
        updatedAt: '2026-05-25T00:00:00Z',
      },
    ]);
  });

  it('throws a readable error when the query fails', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(getClasses()).rejects.toThrow(/boom/);
  });
});

describe('getClass', () => {
  it('returns null when no class is found', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    expect(await getClass('missing')).toBeNull();
  });

  it('maps a found row and normalizes null schulstufe to undefined', async () => {
    maybeSingleMock.mockResolvedValue({ data: { ...row, schulstufe: null }, error: null });
    const result = await getClass('c-1');
    expect(result?.schulstufe).toBeUndefined();
    expect(result?.name).toBe('5A 2026/27');
  });
});
