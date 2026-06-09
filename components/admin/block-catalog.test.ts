import { describe, expect, it } from 'vitest';
import { blockSchema, type BlockType } from '@/lib/schemas/blocks';
import { BLOCK_CATALOG, createDefaultBlock } from '@/components/admin/block-catalog';

// Vertrag: jeder Catalog-Eintrag muss einen Default-Stub liefern, den Zod ohne
// Murren akzeptiert. Sonst wirft der Editor beim ersten Klick einen Validation-
// Error. Außerdem: keine id-Kollisionen mit bereits vorhandenen Blöcken.

const ALL_TYPES: BlockType[] = [
  ...BLOCK_CATALOG.theory,
  ...BLOCK_CATALOG.worksheet,
  ...BLOCK_CATALOG.live,
].map((e) => e.type);

describe('BLOCK_CATALOG', () => {
  it('deckt alle 18 Block-Typen genau einmal ab', () => {
    expect(ALL_TYPES).toHaveLength(18);
    expect(new Set(ALL_TYPES).size).toBe(18);
  });

  it('hat in jeder Gruppe nur passende Typen', () => {
    expect(BLOCK_CATALOG.theory.map((e) => e.type)).toEqual(['slide', 'text', 'infobox']);
    expect(BLOCK_CATALOG.worksheet.map((e) => e.type)).toEqual([
      'multiple_choice',
      'true_false',
      'fill_blank',
      'match',
      'categorize',
      'mark_words',
      'order',
      'hotspot',
      'label_image',
      'reflection',
    ]);
    expect(BLOCK_CATALOG.live.map((e) => e.type)).toEqual([
      'live_poll',
      'quiz_poll',
      'word_cloud',
      'scale',
      'understanding',
    ]);
  });

  it('jeder Eintrag hat label + nicht-leere description', () => {
    for (const entry of [
      ...BLOCK_CATALOG.theory,
      ...BLOCK_CATALOG.worksheet,
      ...BLOCK_CATALOG.live,
    ]) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(20);
    }
  });
});

describe('createDefaultBlock', () => {
  for (const type of ALL_TYPES) {
    it(`liefert für '${type}' einen Zod-konformen Default-Block`, () => {
      const block = createDefaultBlock(type, []);
      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
      expect(block.type).toBe(type);
      expect(block.id).toMatch(/^[a-z]+\d+$/);
    });
  }

  it('vergibt eindeutige IDs auch bei bereits belegten', () => {
    const block1 = createDefaultBlock('text', []);
    expect(block1.id).toBe('b1');
    const block2 = createDefaultBlock('text', ['b1']);
    expect(block2.id).toBe('b2');
    const block3 = createDefaultBlock('text', ['b1', 'b2', 'b3', 'b4']);
    expect(block3.id).toBe('b5');
  });

  it('respektiert Prefix-Trennung pro Typ', () => {
    expect(createDefaultBlock('multiple_choice', []).id).toBe('mc1');
    expect(createDefaultBlock('live_poll', []).id).toBe('p1');
    expect(createDefaultBlock('quiz_poll', []).id).toBe('q1');
    expect(createDefaultBlock('understanding', []).id).toBe('u1');
  });
});
