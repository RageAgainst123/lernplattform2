import { beforeEach, describe, expect, it, vi } from 'vitest';

// Phase V Hotfix (2026-06-05): isAssigned() prüft zwei Quellen:
//   1. class_modules (direkte Zuweisung — Bestand)
//   2. class_topics + modules.topic_id (Phase-V-Source-of-Truth)
//
// Vor diesem Hotfix gab /s/modul/[id] 404 für Module, die nur per Topic
// zugewiesen waren — typisch nach `assignTopicToClass()` in Phase V.

vi.mock('server-only', () => ({}));

type SvcResponse = { data: unknown; error: { message: string } | null };
const svcResponses: Record<string, SvcResponse> = {};

function makeBuilder(table: string) {
  const response = svcResponses[table] ?? { data: null, error: null };
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => response),
        })),
        maybeSingle: vi.fn(async () => response),
      })),
    })),
  };
}

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((t: string) => makeBuilder(t)),
  })),
}));

import { isAssigned } from '@/lib/db/student-modules';

beforeEach(() => {
  for (const k of Object.keys(svcResponses)) delete svcResponses[k];
});

describe('isAssigned (Phase V Hotfix)', () => {
  it('liefert true bei direkter class_modules-Zuweisung', async () => {
    svcResponses.class_modules = { data: { id: 'cm-1' }, error: null };
    // modules + class_topics werden gar nicht erst befragt
    expect(await isAssigned('mod-1', 'class-1')).toBe(true);
  });

  it('liefert true bei Topic-basierter Zuweisung (Phase V)', async () => {
    svcResponses.class_modules = { data: null, error: null }; // keine direkte
    svcResponses.modules = { data: { topic_id: 'topic-eva' }, error: null };
    svcResponses.class_topics = { data: { class_id: 'class-1' }, error: null };
    expect(await isAssigned('mod-1', 'class-1')).toBe(true);
  });

  it('liefert false wenn weder class_modules noch class_topics matchen', async () => {
    svcResponses.class_modules = { data: null, error: null };
    svcResponses.modules = { data: { topic_id: 'topic-eva' }, error: null };
    svcResponses.class_topics = { data: null, error: null };
    expect(await isAssigned('mod-1', 'class-1')).toBe(false);
  });

  it('liefert false wenn Modul kein topic_id hat (Orphan)', async () => {
    svcResponses.class_modules = { data: null, error: null };
    svcResponses.modules = { data: { topic_id: null }, error: null };
    expect(await isAssigned('mod-1', 'class-1')).toBe(false);
  });

  it('liefert false wenn Modul nicht existiert', async () => {
    svcResponses.class_modules = { data: null, error: null };
    svcResponses.modules = { data: null, error: null };
    expect(await isAssigned('mod-missing', 'class-1')).toBe(false);
  });
});
