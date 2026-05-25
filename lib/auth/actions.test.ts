import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn((_url: string) => undefined);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { signOut: signOutMock },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (path: string, type?: string) => revalidatePathMock(path, type),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error('REDIRECT');
  },
}));

import { signOut } from '@/lib/auth/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signOut', () => {
  it('signs out, revalidates the layout and redirects to /login', async () => {
    signOutMock.mockResolvedValue({ error: null });

    await expect(signOut()).rejects.toThrow('REDIRECT');

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
