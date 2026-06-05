import { beforeEach, describe, expect, it, vi } from 'vitest';

// Router-Mock: pro from(tableName)-Call ein eigener Builder.
// Phase-V-Hotfix (2026-06-05): getAssignedModulesForClass spricht jetzt
// mit zwei Tabellen — class_modules (direkter Pfad) und class_topics
// (Phase-V-Pfad) — plus optional modules über Service-Client.

type Resp = { data: unknown; error: { message: string } | null };
const userResponses: Record<string, Resp> = {};
const svcResponses: Record<string, Resp> = {};

function makeBuilder(responses: Record<string, Resp>, table: string) {
  const response = responses[table] ?? { data: [], error: null };
  // .select().eq(...) → Promise (für class_modules/class_topics)
  // .select().in(...).eq(...) → Promise (für modules-Filter mit topic_id IN + is_published)
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve(response)),
      in: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(response)),
      })),
    })),
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((t: string) => makeBuilder(userResponses, t)),
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((t: string) => makeBuilder(svcResponses, t)),
  })),
}));

import { getAssignedModulesForClass } from '@/lib/db/class-modules';

beforeEach(() => {
  for (const k of Object.keys(userResponses)) delete userResponses[k];
  for (const k of Object.keys(svcResponses)) delete svcResponses[k];
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
    activity_kind: 'lernmodul',
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
    activity_kind: 'lernmodul',
    display_mode: 'worksheet',
  },
};

describe('getAssignedModulesForClass — direkter class_modules-Pfad', () => {
  it('maps DB rows to AssignedModuleForTeacher objects', async () => {
    userResponses.class_modules = { data: [rowEva], error: null };
    userResponses.class_topics = { data: [], error: null };
    const result = await getAssignedModulesForClass('class-1');
    expect(result).toEqual([
      {
        moduleId: 'eva-id',
        title: 'Das EVA-Prinzip',
        description: null,
        schulstufe: 5,
        topic: 'EVA-Prinzip',
        activityKind: 'lernmodul',
        displayMode: 'worksheet',
        dueDate: null,
        assignedAt: '2026-05-29T10:00:00Z',
        passThreshold: null,
      },
    ]);
  });

  it('sorts assigned modules alphabetically by title (German collation)', async () => {
    userResponses.class_modules = { data: [rowSuchen, rowEva], error: null };
    userResponses.class_topics = { data: [], error: null };
    const result = await getAssignedModulesForClass('class-1');
    expect(result.map((m) => m.title)).toEqual(['Das EVA-Prinzip', 'Suchen im Internet']);
  });

  it('filters out rows whose nested modules join is null', async () => {
    const broken = { ...rowEva, modules: null };
    userResponses.class_modules = { data: [rowEva, broken], error: null };
    userResponses.class_topics = { data: [], error: null };
    const result = await getAssignedModulesForClass('class-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.moduleId).toBe('eva-id');
  });

  it('falls back to display_mode "quiz" when DB value is null', async () => {
    const noMode = { ...rowEva, modules: { ...rowEva.modules, display_mode: null } };
    userResponses.class_modules = { data: [noMode], error: null };
    userResponses.class_topics = { data: [], error: null };
    const result = await getAssignedModulesForClass('class-1');
    expect(result[0]?.displayMode).toBe('quiz');
  });

  it('throws a readable error when the class_modules query fails', async () => {
    userResponses.class_modules = { data: null, error: { message: 'rls denied' } };
    userResponses.class_topics = { data: [], error: null };
    await expect(getAssignedModulesForClass('class-1')).rejects.toThrow(/rls denied/);
  });

  it('returns an empty array when no modules are assigned (both quellen leer)', async () => {
    userResponses.class_modules = { data: [], error: null };
    userResponses.class_topics = { data: [], error: null };
    expect(await getAssignedModulesForClass('class-1')).toEqual([]);
  });
});

describe('getAssignedModulesForClass — Phase-V Topic-Pfad', () => {
  it('liefert published Module aus class_topics auch ohne class_modules-Eintrag', async () => {
    userResponses.class_modules = { data: [], error: null };
    userResponses.class_topics = {
      data: [{ topic_id: 'topic-eva', assigned_at: '2026-06-05T08:00:00Z' }],
      error: null,
    };
    svcResponses.modules = {
      data: [
        {
          id: 'mod-via-topic',
          title: 'Modul via Topic',
          description: 'desc',
          schulstufe: 6,
          topic: 'EVA',
          topic_id: 'topic-eva',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
        },
      ],
      error: null,
    };

    const result = await getAssignedModulesForClass('class-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      moduleId: 'mod-via-topic',
      title: 'Modul via Topic',
      description: 'desc',
      schulstufe: 6,
      topic: 'EVA',
      activityKind: 'lernmodul',
      displayMode: 'worksheet',
      dueDate: null,
      assignedAt: '2026-06-05T08:00:00Z',
      passThreshold: null,
    });
  });

  it('dedupliziert: direkter Eintrag gewinnt über Topic-Eintrag (Overrides bleiben)', async () => {
    userResponses.class_modules = {
      data: [{ ...rowEva, pass_threshold: 75 }],
      error: null,
    };
    userResponses.class_topics = {
      data: [{ topic_id: 'topic-x', assigned_at: '2026-06-05T08:00:00Z' }],
      error: null,
    };
    // Service liefert das gleiche Modul (eva-id) auch über topic-x
    svcResponses.modules = {
      data: [
        {
          id: 'eva-id',
          title: 'Das EVA-Prinzip',
          description: null,
          schulstufe: 5,
          topic: 'EVA-Prinzip',
          topic_id: 'topic-x',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
        },
      ],
      error: null,
    };

    const result = await getAssignedModulesForClass('class-1');
    expect(result).toHaveLength(1);
    // Override-Wert pass_threshold=75 muss erhalten bleiben (direkt-Eintrag gewinnt)
    expect(result[0]?.passThreshold).toBe(75);
  });

  it('vereinigt direkte + Topic-Zuweisungen ohne Duplikate', async () => {
    userResponses.class_modules = { data: [rowEva], error: null };
    userResponses.class_topics = {
      data: [{ topic_id: 'topic-show', assigned_at: '2026-06-05T08:00:00Z' }],
      error: null,
    };
    svcResponses.modules = {
      data: [
        {
          id: 'show-id',
          title: 'Showcase Modul',
          description: null,
          schulstufe: 6,
          topic: 'Showcase',
          topic_id: 'topic-show',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
        },
      ],
      error: null,
    };

    const result = await getAssignedModulesForClass('class-1');
    expect(result.map((m) => m.moduleId).sort()).toEqual(['eva-id', 'show-id']);
  });
});
