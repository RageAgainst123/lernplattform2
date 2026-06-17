import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildBackfillInserts } from './quiz-end-backfill';

describe('buildBackfillInserts', () => {
  const order = [{ blockId: 'b1' }, { blockId: 'b2' }, { blockId: 'b3' }];

  it('fills missing answers for all students × reached questions', () => {
    const inserts = buildBackfillInserts({
      sessionId: 'sess-1',
      studentCodeIds: ['alice', 'bob'],
      seen: new Set(), // niemand hat geantwortet
      questionOrder: order,
      currentQuestionIndex: 2, // alle 3 Fragen erreicht
    });
    expect(inserts).toHaveLength(6); // 2 students × 3 questions
    expect(inserts[0]).toMatchObject({
      session_id: 'sess-1',
      student_code_id: 'alice',
      question_index: 0,
      block_id: 'b1',
      answer: null,
      is_correct: false,
      points_awarded: 0,
    });
  });

  it('skips already-answered pairs', () => {
    const inserts = buildBackfillInserts({
      sessionId: 'sess-1',
      studentCodeIds: ['alice', 'bob'],
      // alice hat Frage 0+1 beantwortet, bob nur Frage 0
      seen: new Set(['alice:0', 'alice:1', 'bob:0']),
      questionOrder: order,
      currentQuestionIndex: 2,
    });
    // alice fehlt q2, bob fehlt q1+q2 → 3 inserts
    expect(inserts).toHaveLength(3);
    expect(inserts.map((i) => `${i.student_code_id}:${i.question_index}`)).toEqual([
      'alice:2',
      'bob:1',
      'bob:2',
    ]);
  });

  it('only fills up to currentQuestionIndex (not beyond reached)', () => {
    // Quiz wurde aus active mit currentQuestionIndex=0 abgebrochen
    const inserts = buildBackfillInserts({
      sessionId: 'sess-1',
      studentCodeIds: ['alice'],
      seen: new Set(),
      questionOrder: order, // 3 Fragen verfügbar
      currentQuestionIndex: 0, // aber nur Frage 0 erreicht
    });
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.question_index).toBe(0);
  });

  it('skips question indices without question in order (defensive)', () => {
    const inserts = buildBackfillInserts({
      sessionId: 'sess-1',
      studentCodeIds: ['alice'],
      seen: new Set(),
      questionOrder: [{ blockId: 'b1' }], // nur 1 Frage definiert
      currentQuestionIndex: 5, // aber Index sagt 5 → defensiv: 1 insert
    });
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.question_index).toBe(0);
  });

  it('returns empty when no students', () => {
    expect(
      buildBackfillInserts({
        sessionId: 'sess-1',
        studentCodeIds: [],
        seen: new Set(),
        questionOrder: order,
        currentQuestionIndex: 2,
      })
    ).toEqual([]);
  });

  it('returns empty when everyone has answered everything', () => {
    expect(
      buildBackfillInserts({
        sessionId: 'sess-1',
        studentCodeIds: ['alice', 'bob'],
        seen: new Set(['alice:0', 'alice:1', 'alice:2', 'bob:0', 'bob:1', 'bob:2']),
        questionOrder: order,
        currentQuestionIndex: 2,
      })
    ).toEqual([]);
  });

  it('all backfill rows have correct constant flags (is_correct=false, points=0)', () => {
    const inserts = buildBackfillInserts({
      sessionId: 'sess-1',
      studentCodeIds: ['alice'],
      seen: new Set(),
      questionOrder: order,
      currentQuestionIndex: 2,
    });
    for (const row of inserts) {
      expect(row.is_correct).toBe(false);
      expect(row.points_awarded).toBe(0);
      expect(row.elapsed_ms).toBe(0);
      expect(row.answer).toBeNull();
    }
  });
});
