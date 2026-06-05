import { beforeEach, describe, expect, it, vi } from 'vitest';

// Tests für Phase-V-Refactored student-topics. Wichtigster Regression-Test:
// Neues Modul im Topic → erscheint automatisch im Schüler-Lernpfad.

vi.mock('server-only', () => ({}));

type SvcResponse = { data: unknown; error: { message: string } | null };
const svcResponses: Record<string, SvcResponse> = {};

function makeSvcBuilder(table: string) {
  const response = svcResponses[table] ?? { data: [], error: null };
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        // .select().eq() → Promise (für class_topics, class_modules, student_progress)
        // .select().eq().eq() → Promise (für modules mit zwei eq-Filtern, z.B. is_published)
        eq: vi.fn(() => Promise.resolve(response)),
        in: vi.fn(() => Promise.resolve(response)),
        then(resolve: (v: SvcResponse) => unknown) {
          return Promise.resolve(response).then(resolve);
        },
      })),
      in: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(response)),
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

import { getAssignedTopicsForStudent } from '@/lib/db/student-topics';

beforeEach(() => {
  for (const k of Object.keys(svcResponses)) delete svcResponses[k];
});

describe('getAssignedTopicsForStudent (Phase V)', () => {
  it('liefert leere Liste wenn weder class_topics noch class_modules', async () => {
    svcResponses.class_topics = { data: [], error: null };
    svcResponses.class_modules = { data: [], error: null };
    svcResponses.student_progress = { data: [], error: null };
    const result = await getAssignedTopicsForStudent('c1', 'student-1');
    expect(result).toEqual([]);
  });

  it('zeigt alle published Module eines via class_topics zugewiesenen Topics', async () => {
    svcResponses.class_topics = { data: [{ topic_id: 't-eva' }], error: null };
    svcResponses.class_modules = { data: [], error: null };
    svcResponses.modules = {
      data: [
        {
          id: 'm-1',
          title: 'EVA 1',
          is_published: true,
          topic_id: 't-eva',
          activity_kind: 'lernmodul',
          sort_order: 1,
        },
        {
          id: 'm-2',
          title: 'EVA 2',
          is_published: true,
          topic_id: 't-eva',
          activity_kind: 'quiz',
          sort_order: 2,
        },
      ],
      error: null,
    };
    svcResponses.student_progress = { data: [], error: null };
    svcResponses.topics = {
      data: [
        {
          id: 't-eva',
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

    const result = await getAssignedTopicsForStudent('c1', 'student-1');
    expect(result).toHaveLength(1);
    expect(result[0]!.modules.map((m) => m.title)).toEqual(['EVA 1', 'EVA 2']);
    expect(result[0]!.total).toBe(2);
  });

  it('filtert Präsentationen aus dem Schüler-Pfad', async () => {
    svcResponses.class_topics = { data: [{ topic_id: 't1' }], error: null };
    svcResponses.class_modules = { data: [], error: null };
    svcResponses.modules = {
      data: [
        {
          id: 'm-lern',
          title: 'Lernmodul',
          is_published: true,
          topic_id: 't1',
          activity_kind: 'lernmodul',
          sort_order: 1,
        },
        {
          id: 'm-pres',
          title: 'Präsentation',
          is_published: true,
          topic_id: 't1',
          activity_kind: 'praesentation',
          sort_order: 2,
        },
      ],
      error: null,
    };
    svcResponses.student_progress = { data: [], error: null };
    svcResponses.topics = {
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

    const result = await getAssignedTopicsForStudent('c1', 'student-1');
    expect(result[0]!.modules.map((m) => m.title)).toEqual(['Lernmodul']);
  });

  it('Kernregression Phase V: neues Modul in Topic erscheint automatisch ohne Re-Assign', async () => {
    // Klasse hat „EVA" via class_topics. class_modules ist leer (kein
    // Modul wurde je einzeln zugewiesen). Vorher hätte das eine leere
    // Liste ergeben. Jetzt: alle published Module des Topics werden gezeigt.
    svcResponses.class_topics = { data: [{ topic_id: 't-eva' }], error: null };
    svcResponses.class_modules = { data: [], error: null };
    svcResponses.modules = {
      data: [
        {
          id: 'm-new',
          title: 'Neu hinzugefügtes Modul',
          is_published: true,
          topic_id: 't-eva',
          activity_kind: 'lernmodul',
          sort_order: 1,
        },
      ],
      error: null,
    };
    svcResponses.student_progress = { data: [], error: null };
    svcResponses.topics = {
      data: [
        {
          id: 't-eva',
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

    const result = await getAssignedTopicsForStudent('c1', 'student-1');
    expect(result[0]!.modules.map((m) => m.title)).toEqual(['Neu hinzugefügtes Modul']);
  });
});
