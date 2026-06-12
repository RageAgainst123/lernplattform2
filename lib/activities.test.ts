import { describe, expect, it } from 'vitest';
import type { BlockType } from '@/lib/schemas/blocks';
import {
  ACTIVITY_INFO,
  ACTIVITY_KINDS,
  MATERIAL_AS_ACTIVITY,
  isBlockAllowedFor,
} from '@/lib/activities';

// Schutzwall gegen versehentliche Drift: Wenn jemand die Listen ändert, brauchts
// einen bewussten Test-Edit. Stellt sicher dass die Block-Trennung sauber bleibt
// (Schüler im Lernmodul sollen keine Live-Polls sehen, Beamer keine Lückentexte).

describe('ACTIVITY_KINDS', () => {
  it('hat genau vier Werte (lernmodul, praesentation, quiz, abschlusstest)', () => {
    expect(ACTIVITY_KINDS).toHaveLength(4);
    expect(new Set(ACTIVITY_KINDS).size).toBe(4);
    expect(ACTIVITY_KINDS).toContain('lernmodul');
    expect(ACTIVITY_KINDS).toContain('praesentation');
    expect(ACTIVITY_KINDS).toContain('quiz');
    expect(ACTIVITY_KINDS).toContain('abschlusstest');
  });

  it('hat zu jeder ActivityKind einen ACTIVITY_INFO-Eintrag', () => {
    for (const kind of ACTIVITY_KINDS) {
      const info = ACTIVITY_INFO[kind];
      expect(info.label).toBeTruthy();
      expect(info.plural).toBeTruthy();
      expect(info.urlSegment).toMatch(/^[a-z]+$/);
      expect(info.description.length).toBeGreaterThan(40);
    }
  });
});

describe('MATERIAL_AS_ACTIVITY', () => {
  it('ist separat von ACTIVITY_KINDS (lebt in materials-Tabelle)', () => {
    expect(MATERIAL_AS_ACTIVITY.label).toBe('Arbeitsblatt');
    expect(MATERIAL_AS_ACTIVITY.urlSegment).toBe('arbeitsblaetter');
  });
});

describe('isBlockAllowedFor', () => {
  it('lernmodul: erlaubt Theorie (ohne slide) + alle Worksheet-Typen', () => {
    const yes: BlockType[] = [
      'text',
      'infobox',
      'multiple_choice',
      'true_false',
      'fill_blank',
      'match',
      'categorize',
      'mark_words',
      'order',
      'hotspot',
      'label_image',
      'memory',
      'crossword',
      'word_search',
      'scramble',
      'reflection',
    ];
    for (const t of yes) expect(isBlockAllowedFor(t, 'lernmodul')).toBe(true);
  });

  it('lernmodul: verbietet slide und alle Live-Blöcke', () => {
    const no: BlockType[] = [
      'slide',
      'live_poll',
      'quiz_poll',
      'word_cloud',
      'scale',
      'understanding',
    ];
    for (const t of no) expect(isBlockAllowedFor(t, 'lernmodul')).toBe(false);
  });

  it('praesentation: erlaubt Theorie (mit slide) + alle Live-Blöcke', () => {
    const yes: BlockType[] = [
      'text',
      'infobox',
      'slide',
      'live_poll',
      'quiz_poll',
      'word_cloud',
      'scale',
      'understanding',
    ];
    for (const t of yes) expect(isBlockAllowedFor(t, 'praesentation')).toBe(true);
  });

  it('praesentation: verbietet alle Worksheet-Aufgaben', () => {
    const no: BlockType[] = ['multiple_choice', 'true_false', 'fill_blank', 'match', 'reflection'];
    for (const t of no) expect(isBlockAllowedFor(t, 'praesentation')).toBe(false);
  });

  it('quiz: erlaubt nur reine Aufgaben-Blöcke (mc, tf, fill, match)', () => {
    const yes: BlockType[] = ['multiple_choice', 'true_false', 'fill_blank', 'match'];
    for (const t of yes) expect(isBlockAllowedFor(t, 'quiz')).toBe(true);
    const no: BlockType[] = ['text', 'infobox', 'slide', 'reflection', 'live_poll'];
    for (const t of no) expect(isBlockAllowedFor(t, 'quiz')).toBe(false);
  });

  it('abschlusstest: erlaubt nur reine Aufgaben-Blöcke (wie quiz)', () => {
    const yes: BlockType[] = ['multiple_choice', 'true_false', 'fill_blank', 'match'];
    for (const t of yes) expect(isBlockAllowedFor(t, 'abschlusstest')).toBe(true);
    const no: BlockType[] = ['text', 'infobox', 'slide', 'reflection', 'live_poll'];
    for (const t of no) expect(isBlockAllowedFor(t, 'abschlusstest')).toBe(false);
  });
});
