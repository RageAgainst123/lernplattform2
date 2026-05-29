import { describe, expect, it } from 'vitest';
import {
  cellKey,
  countMatrixStatuses,
  getCellOrOpen,
  type ClassProgressMatrix,
} from '@/lib/db/class-progress';

// Reine Matrix-Helper-Tests (kein DB-Mock nötig). Die DB-Variante
// getClassProgress() ist ein dünner Wrapper um drei Queries — sie wird im
// Browser-Smoke verifiziert.

function buildMatrix(): ClassProgressMatrix {
  return {
    students: [
      { id: 's1', codename: '5T-01' },
      { id: 's2', codename: '5T-02' },
    ],
    modules: [
      {
        moduleId: 'm1',
        title: 'EVA',
        description: null,
        schulstufe: 5,
        topic: 'EVA',
        displayMode: 'worksheet',
        dueDate: null,
        assignedAt: '2026-05-29T00:00:00Z',
      },
      {
        moduleId: 'm2',
        title: 'Suchen',
        description: null,
        schulstufe: 5,
        topic: 'Suchen',
        displayMode: 'worksheet',
        dueDate: null,
        assignedAt: '2026-05-29T00:00:00Z',
      },
    ],
    cellMap: new Map([
      // s1 hat EVA abgegeben.
      [
        cellKey('s1', 'm1'),
        {
          studentCodeId: 's1',
          moduleId: 'm1',
          status: 'done',
          score: 4,
          maxScore: 5,
          lastActivityAt: '2026-05-29T12:00:00Z',
          completedAt: '2026-05-29T12:00:00Z',
        },
      ],
      // s1 hat Suchen begonnen.
      [
        cellKey('s1', 'm2'),
        {
          studentCodeId: 's1',
          moduleId: 'm2',
          status: 'in_progress',
          score: 0,
          maxScore: null,
          lastActivityAt: '2026-05-29T13:00:00Z',
          completedAt: null,
        },
      ],
      // s2 hat EVA begonnen, Suchen noch nicht — Suchen-Zelle fehlt absichtlich.
      [
        cellKey('s2', 'm1'),
        {
          studentCodeId: 's2',
          moduleId: 'm1',
          status: 'in_progress',
          score: 0,
          maxScore: null,
          lastActivityAt: '2026-05-29T14:00:00Z',
          completedAt: null,
        },
      ],
    ]),
  };
}

describe('cellKey', () => {
  it('combines studentId and moduleId with a separator', () => {
    expect(cellKey('s', 'm')).toBe('s::m');
  });
});

describe('getCellOrOpen', () => {
  it('returns an existing cell when present', () => {
    const matrix = buildMatrix();
    const cell = getCellOrOpen(matrix, 's1', 'm1');
    expect(cell.status).toBe('done');
    expect(cell.score).toBe(4);
  });

  it('returns an open default when no row exists', () => {
    const matrix = buildMatrix();
    const cell = getCellOrOpen(matrix, 's2', 'm2');
    expect(cell.status).toBe('open');
    expect(cell.score).toBeNull();
    expect(cell.completedAt).toBeNull();
  });
});

describe('countMatrixStatuses', () => {
  it('counts done / in_progress / open across all (student, module) pairs', () => {
    const matrix = buildMatrix();
    // 2 Schüler × 2 Module = 4 Zellen:
    //   s1×m1 done · s1×m2 in_progress · s2×m1 in_progress · s2×m2 open
    expect(countMatrixStatuses(matrix)).toEqual({ done: 1, in_progress: 2, open: 1 });
  });

  it('returns zeros for an empty matrix', () => {
    const matrix: ClassProgressMatrix = {
      students: [],
      modules: [],
      cellMap: new Map(),
    };
    expect(countMatrixStatuses(matrix)).toEqual({ done: 0, in_progress: 0, open: 0 });
  });
});
