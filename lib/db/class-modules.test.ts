import { beforeEach, describe, expect, it, vi } from 'vitest';

// Verkettbarer Supabase-Mock: from(...).select(...).eq(...) → Promise.
const eqMock = vi.fn();
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
}));

import { getAssignedModulesForClass } from '@/lib/db/class-modules';

beforeEach(() => {
  vi.clearAllMocks();
});

const rowEva = {
  module_id: 'eva-id',
  due_date: null,
  assigned_at: '2026-05-29T10:00:00Z',
  pass_threshold: null,
  modules: {
    title: 'Das EVA-Prinzip',
    description: null,
    schulstufe: 5,
    topic: 'EVA-Prinzip',
    display_mode: 'worksheet',
  },
};

const rowSuchen = {
  module_id: 'suchen-id',
  due_date: '2026-06-15',
  assigned_at: '2026-05-29T11:00:00Z',
  pass_threshold: 80,
  modules: {
    title: 'Suchen im Internet',
    description: 'desc',
    schulstufe: 5,
    topic: 'Suchen im Internet',
    display_mode: 'worksheet',
  },
};

describe('getAssignedModulesForClass', () => {
  it('maps DB rows to AssignedModuleForTeacher objects', async () => {
    eqMock.mockResolvedValue({ data: [rowEva], error: null });
    const result = await getAssignedModulesForClass('class-1');
    expect(result).toEqual([
      {
        moduleId: 'eva-id',
        title: 'Das EVA-Prinzip',
        description: null,
        schulstufe: 5,
        topic: 'EVA-Prinzip',
        displayMode: 'worksheet',
        dueDate: null,
        assignedAt: '2026-05-29T10:00:00Z',
        passThreshold: null,
      },
    ]);
  });

  it('sorts assigned modules alphabetically by title (German collation)', async () => {
    eqMock.mockResolvedValue({ data: [rowSuchen, rowEva], error: null });
    const result = await getAssignedModulesForClass('class-1');
    expect(result.map((m) => m.title)).toEqual(['Das EVA-Prinzip', 'Suchen im Internet']);
  });

  it('filters out rows whose nested modules join is null', async () => {
    const broken = { ...rowEva, modules: null };
    eqMock.mockResolvedValue({ data: [rowEva, broken], error: null });
    const result = await getAssignedModulesForClass('class-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.moduleId).toBe('eva-id');
  });

  it('falls back to display_mode "quiz" when DB value is null', async () => {
    const noMode = { ...rowEva, modules: { ...rowEva.modules, display_mode: null } };
    eqMock.mockResolvedValue({ data: [noMode], error: null });
    const result = await getAssignedModulesForClass('class-1');
    expect(result[0]?.displayMode).toBe('quiz');
  });

  it('throws a readable error when the query fails', async () => {
    eqMock.mockResolvedValue({ data: null, error: { message: 'rls denied' } });
    await expect(getAssignedModulesForClass('class-1')).rejects.toThrow(/rls denied/);
  });

  it('returns an empty array when no modules are assigned', async () => {
    eqMock.mockResolvedValue({ data: [], error: null });
    expect(await getAssignedModulesForClass('class-1')).toEqual([]);
  });
});
