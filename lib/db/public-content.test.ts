import { describe, expect, it } from 'vitest';
import { groupByTopic, topicSlug, type PublicMaterial, type PublicModule } from './public-content';

// Pure-Logic-Tests für den Group-Helper. Der DB-Aufruf `getBereichWithTopics`
// reicht die Daten nur durch — eigenständig per E2E im Browser geprüft.

function mat(id: string, title: string): PublicMaterial {
  return {
    id,
    title,
    description: null,
    materialType: 'arbeitsblatt',
    fileUrl: `https://example/storage/${id}.pdf`,
  };
}

function mod(id: string, title: string, topic: string | null): PublicModule {
  return { id, title, description: null, topic };
}

describe('topicSlug', () => {
  it('lowercases and replaces whitespace with dashes', () => {
    expect(topicSlug('EVA-Prinzip')).toBe('eva-prinzip');
    expect(topicSlug('Was ist ein Computer')).toBe('was-ist-ein-computer');
  });
});

describe('groupByTopic', () => {
  it('returns an empty array when nothing is given', () => {
    expect(groupByTopic([], [])).toEqual([]);
  });

  it('groups materials and modules by topic and sorts alphabetically', () => {
    const result = groupByTopic(
      [
        { material: mat('m1', 'B-Arbeitsblatt'), topic: 'EVA-Prinzip' },
        { material: mat('m2', 'A-Arbeitsblatt'), topic: 'EVA-Prinzip' },
        { material: mat('m3', 'X'), topic: 'Bits & Bytes' },
      ],
      [mod('u1', 'Quiz', 'EVA-Prinzip')]
    );

    expect(result.map((t) => t.topic)).toEqual(['Bits & Bytes', 'EVA-Prinzip']);
    const eva = result.find((t) => t.topic === 'EVA-Prinzip');
    expect(eva?.slug).toBe('eva-prinzip');
    expect(eva?.materials.map((m) => m.title)).toEqual(['A-Arbeitsblatt', 'B-Arbeitsblatt']);
    expect(eva?.modules.map((m) => m.title)).toEqual(['Quiz']);
  });

  it('discards materials and modules without topic', () => {
    const result = groupByTopic(
      [
        { material: mat('m1', 'Stray'), topic: null },
        { material: mat('m2', 'Real'), topic: 'EVA-Prinzip' },
      ],
      [mod('u1', 'Floating', null), mod('u2', 'Bound', 'EVA-Prinzip')]
    );
    expect(result).toHaveLength(1);
    expect(result[0].materials).toHaveLength(1);
    expect(result[0].modules).toHaveLength(1);
  });

  it('creates a topic entry even if it only has modules (no materials)', () => {
    const result = groupByTopic([], [mod('u1', 'Quiz', 'Nur-Modul')]);
    expect(result).toEqual([
      {
        topic: 'Nur-Modul',
        slug: 'nur-modul',
        materials: [],
        modules: [mod('u1', 'Quiz', 'Nur-Modul')],
      },
    ]);
  });
});
