import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Router-Mock: pro `.from(tableName)`-Call wird ein eigener Builder
// zurückgegeben, der für `.select().eq(...)` bzw. `.select().in(...)` die
// jeweils registrierte Response liefert. Reicht für die zwei Pfade in
// class-topics.ts (User-Client für class_topics + class_modules, Service-
// Client für modules + topics).

type TableResponse = {
  data: unknown;
  error: { message: string } | null;
  // Für head:true-Count-Queries (getTopicClassAssignmentCount).
  count?: number | null;
};
const responses: Record<string, TableResponse> = {};

function makeQueryBuilder(tableName: string) {
  const response = responses[tableName] ?? { data: [], error: null };
  // .select().eq(...) → Promise (für class_topics, class_modules)
  // .select().in(...) → Promise (für modules, topics)
  const terminal = Promise.resolve(response);
  const builder = {
    select: vi.fn(() => ({
      eq: vi.fn(() => terminal),
      in: vi.fn(() => terminal),
    })),
  };
  return builder;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => makeQueryBuilder(table)),
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => makeQueryBuilder(table)),
  })),
}));

import { getAssignedTopicsForClass, getTopicClassAssignmentCount } from '@/lib/db/class-topics';

beforeEach(() => {
  for (const k of Object.keys(responses)) delete responses[k];
});

describe('getAssignedTopicsForClass — Phase V (class_topics als Source of Truth)', () => {
  it('liefert leere Liste, wenn weder class_topics noch class_modules Einträge hat', async () => {
    responses.class_topics = { data: [], error: null };
    responses.class_modules = { data: [], error: null };
    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics).toEqual([]);
    expect(result.orphanModules).toEqual([]);
  });

  it('liest Topic via class_topics + alle published Module per topic_id (Phase V)', async () => {
    responses.class_topics = {
      data: [{ topic_id: 'topic-eva', due_date: null }],
      error: null,
    };
    responses.class_modules = { data: [], error: null }; // keine Overrides
    responses.modules = {
      data: [
        {
          id: 'mod-1',
          title: 'EVA Lernmodul',
          topic_id: 'topic-eva',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 1,
          is_published: true,
        },
        {
          id: 'mod-2',
          title: 'EVA Quiz',
          topic_id: 'topic-eva',
          activity_kind: 'quiz',
          display_mode: 'quiz',
          sort_order: 2,
          is_published: true,
        },
        {
          // Unpubliziert → muss gefiltert werden
          id: 'mod-3',
          title: 'EVA Draft',
          topic_id: 'topic-eva',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 3,
          is_published: false,
        },
      ],
      error: null,
    };
    responses.topics = {
      data: [
        {
          id: 'topic-eva',
          slug: 'eva-prinzip',
          label: 'EVA-Prinzip',
          description: null,
          schulstufe: 5,
          kompetenzbereich: 'information',
          sort_order: 1,
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics).toHaveLength(1);
    const topic = result.topics[0]!;
    expect(topic.source).toBe('topic');
    expect(topic.modulesByKind.lernmodul.map((m) => m.title)).toEqual(['EVA Lernmodul']);
    expect(topic.modulesByKind.quiz.map((m) => m.title)).toEqual(['EVA Quiz']);
    // Unpubliziertes Modul wurde gefiltert
    expect(topic.modulesByKind.lernmodul).toHaveLength(1);
  });

  it('sortiert Module pro Aktivität nach sort_order', async () => {
    responses.class_topics = { data: [{ topic_id: 't1', due_date: null }], error: null };
    responses.class_modules = { data: [], error: null };
    responses.modules = {
      data: [
        {
          id: 'm-c',
          title: 'C',
          topic_id: 't1',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 3,
          is_published: true,
        },
        {
          id: 'm-a',
          title: 'A',
          topic_id: 't1',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 1,
          is_published: true,
        },
        {
          id: 'm-b',
          title: 'B',
          topic_id: 't1',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 2,
          is_published: true,
        },
      ],
      error: null,
    };
    responses.topics = {
      data: [
        {
          id: 't1',
          slug: 't1',
          label: 'T1',
          description: null,
          schulstufe: 5,
          kompetenzbereich: 'information',
          sort_order: 1,
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics[0]!.modulesByKind.lernmodul.map((m) => m.moduleId)).toEqual([
      'm-a',
      'm-b',
      'm-c',
    ]);
  });

  it('reicht class_modules-Overrides (dueDate, passThreshold) durch zum Topic-Modul-Entry', async () => {
    responses.class_topics = { data: [{ topic_id: 't1', due_date: null }], error: null };
    responses.class_modules = {
      data: [
        {
          module_id: 'mod-1',
          due_date: '2026-07-01',
          pass_threshold: 80,
          modules: {
            title: 'Mod 1',
            topic_id: 't1',
            activity_kind: 'lernmodul',
            display_mode: 'worksheet',
            sort_order: 1,
            is_published: true,
          },
        },
      ],
      error: null,
    };
    responses.modules = {
      data: [
        {
          id: 'mod-1',
          title: 'Mod 1',
          topic_id: 't1',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 1,
          is_published: true,
        },
      ],
      error: null,
    };
    responses.topics = {
      data: [
        {
          id: 't1',
          slug: 't1',
          label: 'T1',
          description: null,
          schulstufe: 5,
          kompetenzbereich: 'information',
          sort_order: 1,
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    const entry = result.topics[0]!.modulesByKind.lernmodul[0]!;
    expect(entry.dueDate).toBe('2026-07-01');
    expect(entry.passThreshold).toBe(80);
  });

  it('zeigt Legacy-Topic (nur class_modules, kein class_topics-Eintrag) mit source=modules_legacy', async () => {
    responses.class_topics = { data: [], error: null };
    responses.class_modules = {
      data: [
        {
          module_id: 'mod-legacy',
          due_date: null,
          pass_threshold: null,
          modules: {
            title: 'Legacy Modul',
            topic_id: 'topic-legacy',
            activity_kind: 'lernmodul',
            display_mode: 'worksheet',
            sort_order: 1,
            is_published: true,
          },
        },
      ],
      error: null,
    };
    responses.modules = {
      data: [
        {
          id: 'mod-legacy',
          title: 'Legacy Modul',
          topic_id: 'topic-legacy',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 1,
          is_published: true,
        },
      ],
      error: null,
    };
    responses.topics = {
      data: [
        {
          id: 'topic-legacy',
          slug: 'legacy',
          label: 'Legacy',
          description: null,
          schulstufe: 5,
          kompetenzbereich: 'information',
          sort_order: 1,
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0]!.source).toBe('modules_legacy');
    expect(result.topics[0]!.modulesByKind.lernmodul).toHaveLength(1);
  });

  it('sammelt class_modules-Einträge ohne topic_id in orphanModules', async () => {
    responses.class_topics = { data: [], error: null };
    responses.class_modules = {
      data: [
        {
          module_id: 'orphan-1',
          due_date: null,
          pass_threshold: null,
          modules: {
            title: 'Orphan',
            topic_id: null,
            activity_kind: 'lernmodul',
            display_mode: 'worksheet',
            sort_order: 0,
            is_published: true,
          },
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics).toEqual([]);
    expect(result.orphanModules).toEqual([
      {
        moduleId: 'orphan-1',
        title: 'Orphan',
        activityKind: 'lernmodul',
        displayMode: 'worksheet',
        dueDate: null,
        passThreshold: null,
        sortOrder: 0,
      },
    ]);
  });

  it('Kernregression: neues Modul (heute eingefügt) erscheint automatisch in zugewiesener Klasse (Phase V)', async () => {
    // Szenario: Klasse hat Topic „EVA" zugewiesen (class_topics). Admin
    // legt heute ein neues Modul „EVA Extra" mit topic_id='topic-eva' an.
    // Vor Phase V: würde nicht erscheinen (class_modules wurde nur einmal
    // beim Assign befüllt). Nach Phase V: erscheint sofort.
    responses.class_topics = { data: [{ topic_id: 'topic-eva', due_date: null }], error: null };
    responses.class_modules = { data: [], error: null }; // niemand hat das neue Modul direkt zugewiesen
    responses.modules = {
      data: [
        {
          id: 'mod-old',
          title: 'EVA Alt',
          topic_id: 'topic-eva',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 1,
          is_published: true,
        },
        {
          id: 'mod-new',
          title: 'EVA Extra',
          topic_id: 'topic-eva',
          activity_kind: 'lernmodul',
          display_mode: 'worksheet',
          sort_order: 2,
          is_published: true,
        },
      ],
      error: null,
    };
    responses.topics = {
      data: [
        {
          id: 'topic-eva',
          slug: 'eva',
          label: 'EVA',
          description: null,
          schulstufe: 5,
          kompetenzbereich: 'information',
          sort_order: 1,
        },
      ],
      error: null,
    };

    const result = await getAssignedTopicsForClass('class-1');
    expect(result.topics[0]!.modulesByKind.lernmodul.map((m) => m.title)).toEqual([
      'EVA Alt',
      'EVA Extra',
    ]);
  });
});

describe('getTopicClassAssignmentCount (V6)', () => {
  it('liefert die Anzahl der Klassen-Zuweisungen', async () => {
    responses.class_topics = { data: null, error: null, count: 3 };
    expect(await getTopicClassAssignmentCount('topic-eva')).toBe(3);
  });

  it('liefert 0 wenn count null ist (keine Zuweisungen)', async () => {
    responses.class_topics = { data: null, error: null, count: null };
    expect(await getTopicClassAssignmentCount('topic-eva')).toBe(0);
  });

  it('wirft bei DB-Fehler', async () => {
    responses.class_topics = { data: null, error: { message: 'kaputt' }, count: null };
    await expect(getTopicClassAssignmentCount('topic-eva')).rejects.toThrow('kaputt');
  });
});
