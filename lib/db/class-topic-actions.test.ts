import { beforeEach, describe, expect, it, vi } from 'vitest';

// Tests für die Phase-V-Refactored Topic-Assignment-Actions.
//
// Erwartungen:
//   - assignTopicToClass schreibt in class_topics (nicht mehr Bulk in class_modules)
//   - unassignTopicFromClass löscht class_topics + räumt class_modules-Bestand auf
//   - Idempotenz: doppeltes Assign wirft keinen Fehler

vi.mock('server-only', () => ({}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/teacher-auth', () => ({
  requireUser: vi.fn(async () => ({ id: 'teacher-1' })),
}));

// Service-Client: mock topics.select().eq().maybeSingle() und modules.select().eq()
type SvcResponse = { data: unknown; error: { message: string } | null };
const svcResponses: Record<string, SvcResponse> = {};

function makeSvcBuilder(table: string) {
  const response = svcResponses[table] ?? { data: [], error: null };
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => response),
        then(resolve: (v: SvcResponse) => unknown) {
          return Promise.resolve(response).then(resolve);
        },
      })),
    })),
  };
}

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((t: string) => makeSvcBuilder(t)),
  })),
}));

// User-Client: mock class_topics.upsert/delete und class_modules.delete
const upsertMock = vi.fn();
const deleteMock = vi.fn();
const eqAfterDelete = vi.fn();
const eqEqAfterDelete = vi.fn();
const inAfterDelete = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      upsert: upsertMock,
      delete: deleteMock,
    })),
  })),
}));

import { assignTopicToClass, unassignTopicFromClass } from '@/lib/db/class-topic-actions';

beforeEach(() => {
  for (const k of Object.keys(svcResponses)) delete svcResponses[k];
  upsertMock.mockReset();
  deleteMock.mockReset();
  eqAfterDelete.mockReset();
  eqEqAfterDelete.mockReset();
  inAfterDelete.mockReset();
});

describe('assignTopicToClass (Phase V)', () => {
  it('lehnt fehlende classId/topicId ab', async () => {
    expect(await assignTopicToClass('', 't1')).toEqual({ error: 'Klasse oder Thema fehlt.' });
    expect(await assignTopicToClass('c1', '')).toEqual({ error: 'Klasse oder Thema fehlt.' });
  });

  it('lehnt nicht-existierendes Topic ab', async () => {
    svcResponses.topics = { data: null, error: null };
    const result = await assignTopicToClass('c1', 't-missing');
    expect(result.error).toMatch(/existiert nicht/);
  });

  it('upsertet in class_topics bei existierendem Topic', async () => {
    svcResponses.topics = { data: { id: 't1' }, error: null };
    upsertMock.mockResolvedValue({ error: null });

    const result = await assignTopicToClass('c1', 't1');
    expect(result.error).toBeNull();
    expect(upsertMock).toHaveBeenCalledWith(
      { class_id: 'c1', topic_id: 't1', due_date: null },
      { onConflict: 'class_id,topic_id', ignoreDuplicates: true }
    );
  });

  it('liefert Fehler-Text bei DB-Fehler', async () => {
    svcResponses.topics = { data: { id: 't1' }, error: null };
    upsertMock.mockResolvedValue({ error: { message: 'rls denied' } });

    const result = await assignTopicToClass('c1', 't1');
    expect(result.error).toMatch(/rls denied/);
  });
});

describe('unassignTopicFromClass (Phase V)', () => {
  it('lehnt fehlende Parameter ab', async () => {
    expect(await unassignTopicFromClass('', 't1')).toEqual({ error: 'Klasse oder Thema fehlt.' });
  });

  it('löscht class_topics + class_modules-Overrides', async () => {
    svcResponses.modules = { data: [{ id: 'mod-1' }, { id: 'mod-2' }], error: null };

    // .delete().eq().eq() — Verkettung für class_topics
    // .delete().eq().in() — Verkettung für class_modules
    const ctEqEq = vi.fn(async () => ({ error: null }));
    const ctEq = vi.fn(() => ({ eq: ctEqEq }));
    const cmIn = vi.fn(async () => ({ error: null }));
    const cmEq = vi.fn(() => ({ in: cmIn }));

    let callCount = 0;
    deleteMock.mockImplementation(() => {
      callCount++;
      // Erster Call: class_topics → .eq().eq()
      // Zweiter Call: class_modules → .eq().in()
      return callCount === 1 ? { eq: ctEq } : { eq: cmEq };
    });

    const result = await unassignTopicFromClass('c1', 't1');
    expect(result.error).toBeNull();
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(cmIn).toHaveBeenCalledWith('module_id', ['mod-1', 'mod-2']);
  });

  it('überspringt class_modules-Cleanup wenn Topic keine Module hat', async () => {
    svcResponses.modules = { data: [], error: null };

    const ctEqEq = vi.fn(async () => ({ error: null }));
    const ctEq = vi.fn(() => ({ eq: ctEqEq }));
    deleteMock.mockImplementation(() => ({ eq: ctEq }));

    const result = await unassignTopicFromClass('c1', 't1');
    expect(result.error).toBeNull();
    // Nur ein Delete (class_topics), kein class_modules-Delete
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
