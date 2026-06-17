import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { decideAutoAdvance } from './quiz-auto-advance';

const NOW = 1_700_000_000_000;
const STARTED = new Date(NOW - 20_000).toISOString(); // vor 20s

describe('decideAutoAdvance', () => {
  it('returns null when status is not active', () => {
    expect(
      decideAutoAdvance({
        status: 'between_questions',
        startedAtIso: STARTED,
        timeLimitSeconds: 30,
        answeredCount: 25,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBeNull();
  });

  it('returns null when no participants (Quiz mit 0 Teilnehmer:innen)', () => {
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: STARTED,
        timeLimitSeconds: 30,
        answeredCount: 0,
        participantCount: 0,
        nowMs: NOW,
      })
    ).toBeNull();
  });

  it('returns all_answered when answered === participants', () => {
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: STARTED,
        timeLimitSeconds: 30,
        answeredCount: 25,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBe('all_answered');
  });

  it('returns all_answered when answered > participants (defensiv)', () => {
    // Sollte nicht vorkommen, aber wir wollen kein None zurückgeben
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: STARTED,
        timeLimitSeconds: 30,
        answeredCount: 26,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBe('all_answered');
  });

  it('returns null when still time and not all answered', () => {
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: STARTED, // vor 20s
        timeLimitSeconds: 30,
        answeredCount: 10,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBeNull();
  });

  it('returns timeout when elapsed > time_limit + 5s grace', () => {
    const longAgo = new Date(NOW - 40_000).toISOString(); // vor 40s
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: longAgo,
        timeLimitSeconds: 30,
        answeredCount: 10,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBe('timeout');
  });

  it('does not return timeout when grace is still active', () => {
    // 32s vergangen bei time_limit=30 → time_limit+5s=35 noch nicht erreicht
    const startedAt = new Date(NOW - 32_000).toISOString();
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: startedAt,
        timeLimitSeconds: 30,
        answeredCount: 10,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBeNull();
  });

  it('returns null when startedAt is null (Lobby-Frage noch nicht gestartet)', () => {
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: null,
        timeLimitSeconds: 30,
        answeredCount: 0,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBeNull();
  });

  it('all_answered hat Vorrang vor Timeout', () => {
    const longAgo = new Date(NOW - 60_000).toISOString();
    expect(
      decideAutoAdvance({
        status: 'active',
        startedAtIso: longAgo,
        timeLimitSeconds: 30,
        answeredCount: 25,
        participantCount: 25,
        nowMs: NOW,
      })
    ).toBe('all_answered');
  });
});
