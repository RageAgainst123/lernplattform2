import { describe, expect, it } from 'vitest';

import { channels, events } from './channels';

describe('channels (Phase T1)', () => {
  it('quizSession produziert quiz_session:{uuid}', () => {
    expect(channels.quizSession('abc-123')).toBe('quiz_session:abc-123');
  });

  it('liveSession produziert live_session:{classId}', () => {
    expect(channels.liveSession('class-uuid')).toBe('live_session:class-uuid');
  });

  it('classProgress produziert class_progress:{classId}', () => {
    expect(channels.classProgress('class-uuid')).toBe('class_progress:class-uuid');
  });

  it('liefert für identische uuids identische Channel-Namen (Idempotenz)', () => {
    const uuid = '00000000-0000-4000-8000-000000000000';
    expect(channels.quizSession(uuid)).toBe(channels.quizSession(uuid));
  });

  it('liefert für unterschiedliche scopes unterschiedliche Channels', () => {
    const uuid = 'foo';
    const q = channels.quizSession(uuid);
    const l = channels.liveSession(uuid);
    const p = channels.classProgress(uuid);
    expect(new Set([q, l, p]).size).toBe(3);
  });
});

describe('events (Phase T1)', () => {
  it('alle Quiz-Events haben snake_case-Namen', () => {
    for (const event of Object.values(events.quiz)) {
      expect(event).toMatch(/^[a-z_]+$/);
    }
  });

  it('alle Event-Sets sind disjoint (keine Doppelungen)', () => {
    const all = [
      ...Object.values(events.quiz),
      ...Object.values(events.live),
      ...Object.values(events.classProgress),
    ];
    expect(new Set(all).size).toBe(all.length);
  });
});
