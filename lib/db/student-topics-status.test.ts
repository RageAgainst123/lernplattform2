import { describe, expect, it } from 'vitest';
import { aggregateTopicStatus, canStartAbschlusstest } from './student-topics-status';
import type { ModuleStatus } from './student-modules-status';

describe('aggregateTopicStatus', () => {
  it('liefert open + leere counts wenn keine Module', () => {
    expect(aggregateTopicStatus([])).toEqual({
      status: 'open',
      total: 0,
      done: 0,
      inProgress: 0,
    });
  });

  it('open wenn alle Module open', () => {
    const stati: ModuleStatus[] = ['open', 'open', 'open'];
    expect(aggregateTopicStatus(stati)).toEqual({
      status: 'open',
      total: 3,
      done: 0,
      inProgress: 0,
    });
  });

  it('in_progress sobald ein Modul begonnen ist', () => {
    const stati: ModuleStatus[] = ['in_progress', 'open', 'open'];
    expect(aggregateTopicStatus(stati)).toMatchObject({
      status: 'in_progress',
      total: 3,
      done: 0,
      inProgress: 1,
    });
  });

  it('returned zählt wie in_progress', () => {
    const stati: ModuleStatus[] = ['returned', 'open'];
    expect(aggregateTopicStatus(stati).status).toBe('in_progress');
    expect(aggregateTopicStatus(stati).inProgress).toBe(1);
  });

  it('in_progress wenn nur ein Teil done', () => {
    const stati: ModuleStatus[] = ['done', 'done', 'open'];
    expect(aggregateTopicStatus(stati)).toMatchObject({
      status: 'in_progress',
      done: 2,
      inProgress: 0,
    });
  });

  it('done wenn alle Module done', () => {
    const stati: ModuleStatus[] = ['done', 'done', 'done'];
    expect(aggregateTopicStatus(stati)).toEqual({
      status: 'done',
      total: 3,
      done: 3,
      inProgress: 0,
    });
  });

  it('returned blockiert done — Themen-Status bleibt in_progress', () => {
    const stati: ModuleStatus[] = ['done', 'done', 'returned'];
    expect(aggregateTopicStatus(stati).status).toBe('in_progress');
  });
});

describe('canStartAbschlusstest', () => {
  it('verboten wenn keine Lernmodule existieren (leerer Pfad)', () => {
    // Schutz vor falscher Freischaltung: ein Thema mit nur einem Abschlusstest
    // und keinen Lernmodulen darf den Test NICHT erlauben.
    expect(canStartAbschlusstest([])).toEqual({ allowed: false, missingTitles: [] });
  });

  it('verboten wenn ein Lernmodul noch nicht done ist', () => {
    const result = canStartAbschlusstest([
      { title: 'Grundlagen', status: 'done' },
      { title: 'Vertiefung', status: 'in_progress' },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.missingTitles).toEqual(['Vertiefung']);
  });

  it('verboten bei returned (Lehrer:in hat zurückgegeben)', () => {
    const result = canStartAbschlusstest([
      { title: 'Grundlagen', status: 'done' },
      { title: 'Vertiefung', status: 'returned' },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.missingTitles).toContain('Vertiefung');
  });

  it('erlaubt wenn alle Lernmodule done', () => {
    const result = canStartAbschlusstest([
      { title: 'Grundlagen', status: 'done' },
      { title: 'Vertiefung', status: 'done' },
    ]);
    expect(result.allowed).toBe(true);
    expect(result.missingTitles).toEqual([]);
  });

  it('liefert mehrere fehlende Titel in originaler Reihenfolge', () => {
    const result = canStartAbschlusstest([
      { title: 'A', status: 'open' },
      { title: 'B', status: 'done' },
      { title: 'C', status: 'in_progress' },
    ]);
    expect(result.missingTitles).toEqual(['A', 'C']);
  });
});
