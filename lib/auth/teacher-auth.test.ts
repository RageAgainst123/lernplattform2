import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

// Mocks für Supabase-Server-Client und Next-Navigation.
const getUserMock = vi.fn();
const upsertMock = vi.fn();
const fromMock = vi.fn(() => ({ upsert: upsertMock }));
const redirectMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error('REDIRECT');
  },
}));

import { ensureTeacherProfile, getUser, requireUser } from '@/lib/auth/teacher-auth';

const fakeUser = { id: 'u-1', email: 'lehrer@schule.at' } as User;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUser', () => {
  it('returns the user when logged in', async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser } });
    expect(await getUser()).toEqual(fakeUser);
  });

  it('returns null when not logged in', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect(await getUser()).toBeNull();
  });
});

describe('requireUser', () => {
  it('returns the user when logged in', async () => {
    getUserMock.mockResolvedValue({ data: { user: fakeUser } });
    expect(await requireUser()).toEqual(fakeUser);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to /login when not logged in', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(requireUser()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});

describe('ensureTeacherProfile', () => {
  it('upserts the teachers row with id, email and a derived name', async () => {
    upsertMock.mockResolvedValue({ error: null });
    await ensureTeacherProfile(fakeUser);
    expect(fromMock).toHaveBeenCalledWith('teachers');
    expect(upsertMock).toHaveBeenCalledWith(
      { id: 'u-1', email: 'lehrer@schule.at', name: 'lehrer' },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  });
});
