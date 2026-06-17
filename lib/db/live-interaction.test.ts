import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Phase-C-Tests: getActivePollForClass generalisiert auf alle interaktiven Typen
// (live_poll, quiz_poll, word_cloud, scale, understanding) — quiz_poll-Optionen
// MÜSSEN ohne correct-Flag zurückkommen (Sicherheits-Garantie). Außerdem:
// getQuizCorrectOptions liefert genau die richtigen IDs zurück.

const maybeSingle = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getActivePollForClass, getQuizCorrectOptions } from '@/lib/db/live-sessions';

function moduleWithBlocks(blocks: unknown[]) {
  return { data: { content: { blocks } } };
}

describe('getActivePollForClass — interaktive Block-Typen (Phase C)', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });
  afterEach(() => {
    maybeSingle.mockReset();
  });

  it('strippt correct-Flag bei quiz_poll (kein Leak an Schüler:innen-Geräte)', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([
        {
          id: 'q1',
          type: 'quiz_poll',
          question: 'Welches ist ein Eingabegerät?',
          options: [
            { id: 'a', text: 'Maus', correct: true },
            { id: 'b', text: 'Drucker', correct: false },
          ],
        },
      ])
    );
    const result = await getActivePollForClass({
      id: 's1',
      moduleId: 'm1',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result).not.toBeNull();
    if (result?.kind !== 'quiz_poll') throw new Error('expected quiz_poll');
    expect(result.options).toEqual([
      { id: 'a', text: 'Maus' },
      { id: 'b', text: 'Drucker' },
    ]);
    // Stelle defensiv sicher, dass `correct` wirklich entfernt wurde.
    for (const opt of result.options) {
      expect(opt).not.toHaveProperty('correct');
    }
  });

  it('liefert live_poll wie gehabt', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([
        {
          id: 'p1',
          type: 'live_poll',
          question: 'Wie geht es?',
          options: [
            { id: 'o1', text: 'Gut' },
            { id: 'o2', text: 'Schlecht' },
          ],
        },
      ])
    );
    const result = await getActivePollForClass({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result?.kind).toBe('live_poll');
  });

  it('liefert word_cloud mit Frage', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([{ id: 'w1', type: 'word_cloud', question: 'Was fällt euch ein?' }])
    );
    const result = await getActivePollForClass({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result).toEqual({ kind: 'word_cloud', blockId: 'w1', question: 'Was fällt euch ein?' });
  });

  it('liefert scale mit min/max + Labels', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([
        {
          id: 'sc1',
          type: 'scale',
          question: 'Wie gut?',
          min: 1,
          max: 5,
          minLabel: 'schlecht',
          maxLabel: 'super',
        },
      ])
    );
    const result = await getActivePollForClass({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result).toEqual({
      kind: 'scale',
      blockId: 'sc1',
      question: 'Wie gut?',
      min: 1,
      max: 5,
      minLabel: 'schlecht',
      maxLabel: 'super',
    });
  });

  it('liefert understanding-Folie', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([{ id: 'u1', type: 'understanding', question: 'Alles klar?' }])
    );
    const result = await getActivePollForClass({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result).toEqual({ kind: 'understanding', blockId: 'u1', question: 'Alles klar?' });
  });

  it('liefert null bei reiner Folie (slide)', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([{ id: 's1', type: 'slide', title: 'Titel', body: 'Inhalt' }])
    );
    const result = await getActivePollForClass({
      id: 's',
      moduleId: 'm',
      currentBlockIndex: 0,
      locked: false,
    });
    expect(result).toBeNull();
  });
});

describe('getQuizCorrectOptions — nur richtige IDs', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it('liefert IDs der richtigen Antworten für quiz_poll', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([
        {
          id: 'q1',
          type: 'quiz_poll',
          question: 'Test?',
          options: [
            { id: 'a', text: 'A', correct: true },
            { id: 'b', text: 'B', correct: false },
            { id: 'c', text: 'C', correct: true },
          ],
        },
      ])
    );
    const ids = await getQuizCorrectOptions(
      { id: 's', moduleId: 'm', currentBlockIndex: 0, locked: false },
      'q1'
    );
    expect(ids).toEqual(['a', 'c']);
  });

  it('liefert leeres Array bei nicht-quiz_poll-Block', async () => {
    maybeSingle.mockResolvedValue(
      moduleWithBlocks([{ id: 'x', type: 'word_cloud', question: '?' }])
    );
    const ids = await getQuizCorrectOptions(
      { id: 's', moduleId: 'm', currentBlockIndex: 0, locked: false },
      'x'
    );
    expect(ids).toEqual([]);
  });
});
