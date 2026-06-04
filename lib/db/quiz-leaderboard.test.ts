import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { rankEntries, findOwnEntry, type Leaderboard } from './quiz-leaderboard';

describe('rankEntries', () => {
  it('sorts descending by totalPoints and assigns ranks', () => {
    const result = rankEntries([
      {
        studentCodeId: 'a',
        displayName: 'Alice',
        isTeam: false,
        totalPoints: 1000,
        correctCount: 3,
      },
      {
        studentCodeId: 'b',
        displayName: 'Bob',
        isTeam: false,
        totalPoints: 2000,
        correctCount: 4,
      },
      {
        studentCodeId: 'c',
        displayName: 'Carol',
        isTeam: false,
        totalPoints: 500,
        correctCount: 2,
      },
    ]);
    expect(result.map((e) => [e.displayName, e.rank])).toEqual([
      ['Bob', 1],
      ['Alice', 2],
      ['Carol', 3],
    ]);
  });

  it('assigns same rank for tied points, next rank skips (RANK-Semantik)', () => {
    // 3000, 2000, 2000, 1000 → Ränge 1, 2, 2, 4
    const result = rankEntries([
      {
        studentCodeId: 'a',
        displayName: 'Alice',
        isTeam: false,
        totalPoints: 3000,
        correctCount: 5,
      },
      {
        studentCodeId: 'b',
        displayName: 'Bob',
        isTeam: false,
        totalPoints: 2000,
        correctCount: 3,
      },
      {
        studentCodeId: 'c',
        displayName: 'Carol',
        isTeam: false,
        totalPoints: 2000,
        correctCount: 3,
      },
      {
        studentCodeId: 'd',
        displayName: 'Dave',
        isTeam: false,
        totalPoints: 1000,
        correctCount: 2,
      },
    ]);
    expect(result.map((e) => [e.displayName, e.rank])).toEqual([
      ['Alice', 1],
      ['Bob', 2],
      ['Carol', 2],
      ['Dave', 4],
    ]);
  });

  it('handles all-zero scores (everyone rank 1)', () => {
    const result = rankEntries([
      {
        studentCodeId: 'a',
        displayName: 'Alice',
        isTeam: false,
        totalPoints: 0,
        correctCount: 0,
      },
      {
        studentCodeId: 'b',
        displayName: 'Bob',
        isTeam: false,
        totalPoints: 0,
        correctCount: 0,
      },
    ]);
    expect(result.every((e) => e.rank === 1)).toBe(true);
  });

  it('handles empty input', () => {
    expect(rankEntries([])).toEqual([]);
  });

  it('does not mutate input array', () => {
    const input = [
      {
        studentCodeId: 'a',
        displayName: 'Alice',
        isTeam: false,
        totalPoints: 500,
        correctCount: 1,
      },
      {
        studentCodeId: 'b',
        displayName: 'Bob',
        isTeam: false,
        totalPoints: 1500,
        correctCount: 3,
      },
    ];
    const before = JSON.stringify(input);
    rankEntries(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('preserves team flag', () => {
    const result = rankEntries([
      {
        studentCodeId: 'cap-a',
        displayName: 'Team Tigers',
        isTeam: true,
        totalPoints: 1500,
        correctCount: 3,
      },
    ]);
    expect(result[0]?.isTeam).toBe(true);
  });
});

describe('findOwnEntry', () => {
  const board: Leaderboard = {
    sessionId: 'sess-1',
    totalParticipants: 2,
    entries: [
      {
        studentCodeId: 'alice-id',
        displayName: 'Alice',
        isTeam: false,
        totalPoints: 2000,
        correctCount: 4,
        rank: 1,
      },
      {
        studentCodeId: 'bob-id',
        displayName: 'Bob',
        isTeam: false,
        totalPoints: 1000,
        correctCount: 2,
        rank: 2,
      },
    ],
  };

  it('finds own entry by studentCodeId', () => {
    expect(findOwnEntry(board, 'alice-id')?.rank).toBe(1);
  });

  it('returns null when not in board', () => {
    expect(findOwnEntry(board, 'stranger-id')).toBeNull();
  });
});
