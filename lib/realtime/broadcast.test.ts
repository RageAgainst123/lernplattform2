import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const sendMock = vi.fn();
const removeChannelMock = vi.fn();

type SubscribeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT';
let subscribeStatusToReturn: SubscribeStatus = 'SUBSCRIBED';

const channelMock = {
  subscribe: vi.fn((cb: (status: SubscribeStatus) => void) => {
    // Simuliere async-Subscribe-Callback
    queueMicrotask(() => cb(subscribeStatusToReturn));
    return channelMock;
  }),
  send: sendMock,
};

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    channel: vi.fn(() => channelMock),
    removeChannel: removeChannelMock,
  })),
}));

import { publishBroadcast } from './broadcast';

beforeEach(() => {
  sendMock.mockReset();
  removeChannelMock.mockReset();
  channelMock.subscribe.mockClear();
  subscribeStatusToReturn = 'SUBSCRIBED';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('publishBroadcast', () => {
  it('liefert ok bei erfolgreichem send', async () => {
    sendMock.mockResolvedValue('ok');
    const res = await publishBroadcast('quiz_session:abc', 'next_question', { questionIndex: 1 });
    expect(res).toBe('ok');
    expect(sendMock).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'next_question',
      payload: { questionIndex: 1 },
    });
  });

  it('cleanup: removeChannel wird nach send aufgerufen', async () => {
    sendMock.mockResolvedValue('ok');
    await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('liefert rate_limited wenn Supabase es zurückgibt', async () => {
    sendMock.mockResolvedValue('rate limited');
    const res = await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(res).toBe('rate_limited');
  });

  it('liefert error bei unbekanntem send-Resultat', async () => {
    sendMock.mockResolvedValue('weird');
    const res = await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(res).toBe('error');
  });

  it('wirft NICHT bei subscribe-Fehler — fängt es ab', async () => {
    subscribeStatusToReturn = 'CHANNEL_ERROR';
    const res = await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(res).toBe('error');
  });

  it('wirft NICHT bei TIMED_OUT — fängt es ab', async () => {
    subscribeStatusToReturn = 'TIMED_OUT';
    const res = await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(res).toBe('error');
  });

  it('wirft NICHT bei send-Exception — fängt es ab', async () => {
    sendMock.mockRejectedValue(new Error('network down'));
    const res = await publishBroadcast('quiz_session:abc', 'foo', {});
    expect(res).toBe('error');
  });
});
