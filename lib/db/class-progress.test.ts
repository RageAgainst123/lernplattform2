import { describe, expect, it } from 'vitest';
import {
  cellKey,
  countMatrixStatuses,
  getCellOrOpen,
  type ClassProgressMatrix,
  type ProgressCell,
} from '@/lib/db/class-progress';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';

// Reine Matrix-Helper-Tests (kein DB-Mock nötig). Wir bauen die Matrix von Hand
// und prüfen die reinen Funktionen (cellKey, getCellOrOpen, countMatrixStatuses)
// — getClassProgress selbst ist ein dünner DB-Wrapper + wird im Browser-Smoke
// getestet.

function cell(
  overrides: Partial<ProgressCell> & Pick<ProgressCell, 'studentCodeId' | 'moduleId'>
): ProgressCell {
  return {
    status: 'done',
    score: null,
    maxScore: null,
    lastActivityAt: null,
    completedAt: null,
    returnedAt: null,
    passed: null,
    passThreshold: null,
    hasFeedback: false,
    ...overrides,
  };
}

function mod(id: string, title: string): AssignedModuleForTeacher {
  return {
    moduleId: id,
    title,
    description: null,
    schulstufe: 5,
    topic: null,
    displayMode: 'quiz',
    dueDate: null,
    assignedAt: '2026-05-29T10:00:00Z',
    passThreshold: null,
  };
}

function buildMatrix(): ClassProgressMatrix {
  const cellMap = new Map<string, ProgressCell>();
  cellMap.set(
    cellKey('s1', 'm1'),
    cell({ studentCodeId: 's1', moduleId: 'm1', status: 'done', score: 4, maxScore: 5 })
  );
  cellMap.set(
    cellKey('s1', 'm2'),
    cell({ studentCodeId: 's1', moduleId: 'm2', status: 'in_progress' })
  );
  cellMap.set(
    cellKey('s2', 'm1'),
    cell({ studentCodeId: 's2', moduleId: 'm1', status: 'returned', returnedAt: 'x' })
  );
  return {
    students: [
      { id: 's1', codename: '5T-01' },
      { id: 's2', codename: '5T-02' },
    ],
    modules: [mod('m1', 'Modul 1'), mod('m2', 'Modul 2')],
    cellMap,
  };
}

describe('cellKey', () => {
  it('combines studentId and moduleId with a separator', () => {
    expect(cellKey('s', 'm')).toBe('s::m');
  });
});

describe('getCellOrOpen', () => {
  it('returns the existing cell when present', () => {
    const matrix = buildMatrix();
    expect(getCellOrOpen(matrix, 's1', 'm1').status).toBe('done');
  });

  it('returns an open cell with neutral defaults when no progress row exists', () => {
    const matrix = buildMatrix();
    const c = getCellOrOpen(matrix, 's2', 'm2');
    expect(c.status).toBe('open');
    expect(c.score).toBeNull();
    expect(c.passed).toBeNull();
    expect(c.hasFeedback).toBe(false);
  });
});

describe('countMatrixStatuses', () => {
  it('counts done / in_progress / returned / open across all pairs', () => {
    const matrix = buildMatrix();
    // s1/m1 done, s1/m2 in_progress, s2/m1 returned, s2/m2 open (no row)
    expect(countMatrixStatuses(matrix)).toEqual({
      done: 1,
      in_progress: 1,
      returned: 1,
      open: 1,
    });
  });
});
