import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn<(url: string) => void>();
const clearStudentSessionMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { signOut: signOutMock },
  })),
}));

vi.mock('@/lib/auth/session-cleanup', () => ({
  clearStudentSession: () => clearStudentSessionMock(),
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
  it('signs out, clears student-session, revalidates the layout and redirects to /login', async () => {
    signOutMock.mockResolvedValue({ error: null });
    clearStudentSessionMock.mockResolvedValue(undefined);

    await expect(signOut()).rejects.toThrow('REDIRECT');

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(clearStudentSessionMock).toHaveBeenCalledOnce();
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
