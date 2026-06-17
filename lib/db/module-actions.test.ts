import { beforeEach, describe, expect, it, vi } from 'vitest';

// V4: duplicateModule — Kopie als Entwurf ohne Themen-Zuordnung.
// Mock-Pattern wie word-heft-links.test.ts (Query-Builder-Chains).

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/auth/admin-auth', () => ({
  requireAdmin: vi.fn(async () => ({ id: 'admin-1' })),
}));

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectAfterFromMock = vi.fn(() => ({ eq: eqMock }));
const singleMock = vi.fn();
const selectAfterInsertMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: selectAfterInsertMock }));
const fromMock = vi.fn(() => ({ select: selectAfterFromMock, insert: insertMock }));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({ from: fromMock })),
}));

import { duplicateModule } from '@/lib/db/module-actions';

const sourceRow = {
  id: 'mod-1',
  title: 'EVA-Prinzip',
  description: 'Beschreibung',
  schulstufe: 5,
  kompetenzbereich: 'information',
  topic: 'EVA',
  topic_id: 'topic-eva',
  sort_order: 3,
  content: { blocks: [{ id: 'b1', type: 'text', content: 'Hallo' }] },
  estimated_minutes: 15,
  is_published: true,
  activity_kind: 'lernmodul',
  display_mode: 'quiz',
  created_by: 'someone-else',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('duplicateModule (V4)', () => {
  it('legt eine Entwurfs-Kopie ohne Themen-Zuordnung an', async () => {
    maybeSingleMock.mockResolvedValue({ data: sourceRow, error: null });
    singleMock.mockResolvedValue({ data: { id: 'mod-copy' }, error: null });

    const result = await duplicateModule('mod-1');

    expect(result).toEqual({ id: 'mod-copy' });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'EVA-Prinzip (Kopie)',
        is_published: false,
        topic_id: null,
        sort_order: 0,
        content: sourceRow.content,
        activity_kind: 'lernmodul',
        created_by: 'admin-1',
      })
    );
  });

  it('wirft wenn das Quell-Modul fehlt', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    await expect(duplicateModule('nope')).rejects.toThrow('Modul nicht gefunden');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('wirft bei Insert-Fehler mit Meldung', async () => {
    maybeSingleMock.mockResolvedValue({ data: sourceRow, error: null });
    singleMock.mockResolvedValue({ data: null, error: { message: 'kaputt' } });
    await expect(duplicateModule('mod-1')).rejects.toThrow('kaputt');
  });
});
