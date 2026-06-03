import { describe, expect, it } from 'vitest';
import type { Block } from '@/lib/schemas/blocks';
import { buildQuizQuestionOrder, isLiveQuizBlock } from '@/lib/quiz/question-order';

// Modul-Blocks → QuizQuestionRef[] für quiz_sessions.question_order.
// Spec §3.9: nur live-taugliche Blocks (MC, T/F, fill_blank). Match wird
// aus Live-Modi ausgefiltert weil Drag&Drop am Handy fragil ist.

function mc(id: string): Block {
  return {
    id,
    type: 'multiple_choice',
    question: 'Frage?',
    options: [
      { id: 'a', text: 'A', correct: true },
      { id: 'b', text: 'B', correct: false },
    ],
  };
}
function tf(id: string): Block {
  return { id, type: 'true_false', question: 'F?', answer: true };
}
function fillBlank(id: string): Block {
  return { id, type: 'fill_blank', text: '{0}', solutions: ['x'], distractors: [] };
}
function match(id: string): Block {
  return {
    id,
    type: 'match',
    pairs: [
      { id: 'p1', term: 'a', category: 'A' },
      { id: 'p2', term: 'b', category: 'B' },
    ],
  };
}
function text(id: string): Block {
  return { id, type: 'text', content: 'Erklärung' };
}
function reflection(id: string): Block {
  return { id, type: 'reflection', prompt: 'Denk nach' };
}

describe('isLiveQuizBlock', () => {
  it('accepts mc/true_false/fill_blank', () => {
    expect(isLiveQuizBlock(mc('m1'))).toBe(true);
    expect(isLiveQuizBlock(tf('t1'))).toBe(true);
    expect(isLiveQuizBlock(fillBlank('f1'))).toBe(true);
  });
  it('rejects match (Drag&Drop am Handy nicht praktikabel)', () => {
    expect(isLiveQuizBlock(match('m1'))).toBe(false);
  });
  it('rejects inhaltliche und live-spezifische Blöcke', () => {
    expect(isLiveQuizBlock(text('t1'))).toBe(false);
    expect(isLiveQuizBlock(reflection('r1'))).toBe(false);
  });
});

describe('buildQuizQuestionOrder', () => {
  it('liefert nur live-taugliche Blocks in original-Reihenfolge', () => {
    const blocks: Block[] = [text('t1'), mc('q1'), match('m1'), tf('q2'), reflection('r1')];
    const order = buildQuizQuestionOrder(blocks);
    expect(order).toEqual([
      { blockId: 'q1', blockType: 'multiple_choice' },
      { blockId: 'q2', blockType: 'true_false' },
    ]);
  });

  it('shuffelt mit seedeter Variante nicht (default) — Reihenfolge stabil', () => {
    const blocks: Block[] = [mc('q1'), tf('q2'), fillBlank('q3')];
    expect(buildQuizQuestionOrder(blocks).map((q) => q.blockId)).toEqual(['q1', 'q2', 'q3']);
  });

  it('shuffelt deterministisch mit gleichem Seed', () => {
    const blocks: Block[] = [mc('a'), mc('b'), mc('c'), mc('d'), mc('e')];
    const r1 = buildQuizQuestionOrder(blocks, { shuffle: true, seed: 42 }).map((q) => q.blockId);
    const r2 = buildQuizQuestionOrder(blocks, { shuffle: true, seed: 42 }).map((q) => q.blockId);
    expect(r1).toEqual(r2);
    // Verschiedene Seeds → unterschiedliche Reihenfolge (mindestens manchmal).
    const r3 = buildQuizQuestionOrder(blocks, { shuffle: true, seed: 7 }).map((q) => q.blockId);
    // Stelle sicher dass shuffle überhaupt etwas verändert hat
    expect(r1.join('')).not.toBe('abcde');
    expect(r3.join('')).not.toBe('abcde');
  });

  it('akzeptiert leere blocks (gibt leere order zurück)', () => {
    expect(buildQuizQuestionOrder([])).toEqual([]);
  });

  it('akzeptiert modul nur mit theorie/match (kein live-tauglicher block)', () => {
    expect(buildQuizQuestionOrder([text('t'), match('m'), reflection('r')])).toEqual([]);
  });
});
