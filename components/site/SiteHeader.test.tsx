import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthSlotInfo } from './HeaderAuth';

// next/navigation usePathname() braucht einen Stub in jsdom
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// `server-only` blockt sonst den Import des Auth-Layers im jsdom-Test.
vi.mock('server-only', () => ({}));

// Auth-Slot wird in SiteHeader serverseitig geholt (Supabase-Call). Im Test
// mocken wir die Datenseite, damit drei Zustände (anonym / Lehrer / Schüler)
// reproduzierbar getestet werden. Die Mock-Variable lebt über vi.hoisted,
// damit die hochgezogene vi.mock-Fabrik sie sehen darf.
const mocks = vi.hoisted(() => ({
  authInfo: { userLabel: null, userKind: null, isAdminUser: false } as AuthSlotInfo,
}));
vi.mock('./HeaderAuth', async () => {
  const real = await vi.importActual<typeof import('./HeaderAuth')>('./HeaderAuth');
  return {
    ...real,
    fetchAuthSlot: vi.fn(async () => mocks.authInfo),
  };
});

// Server-Actions in den Logout-Forms sind irrelevant für die Render-Tests,
// brauchen aber Stubs (kein DB-Zugriff im jsdom).
vi.mock('@/lib/auth/actions', () => ({ signOut: vi.fn() }));
vi.mock('@/lib/auth/student-actions', () => ({ studentLogout: vi.fn() }));

// SiteHeader nach den Mocks importieren, damit sie greifen.
const { SiteHeader } = await import('./SiteHeader');

async function renderHeaderWithInfo(info: AuthSlotInfo) {
  mocks.authInfo = info;
  const ui = await SiteHeader();
  render(ui);
}

describe('SiteHeader', () => {
  it('renders the brand logo as a link to the homepage', async () => {
    await renderHeaderWithInfo({ userLabel: null, userKind: null, isAdminUser: false });
    const logo = screen.getByRole('link', { name: /Startseite/i });
    expect(logo).toHaveAttribute('href', '/');
  });

  it('shows the main navigation links + Lehrer:innen-Login when logged out', async () => {
    await renderHeaderWithInfo({ userLabel: null, userKind: null, isAdminUser: false });
    expect(screen.getByRole('link', { name: 'Materialien' })).toHaveAttribute('href', '/dgb');
    expect(screen.getByRole('link', { name: /Schüler:innen-Login/ })).toHaveAttribute('href', '/k');
    expect(screen.getAllByRole('link', { name: /Lehrer:innen-Login/ })[0]).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('shows the student codename + Abmelden when logged in as student', async () => {
    await renderHeaderWithInfo({
      userLabel: '5A-01',
      userKind: 'student',
      isAdminUser: false,
    });
    expect(screen.getByText('5A-01')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Abmelden' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Lehrer:innen-Login/ })).not.toBeInTheDocument();
  });

  it('shows the teacher email + Abmelden + Admin-Link when logged in as admin', async () => {
    await renderHeaderWithInfo({
      userLabel: 'geoschlegel@gmail.com',
      userKind: 'teacher',
      isAdminUser: true,
    });
    expect(screen.getByText('geoschlegel@gmail.com')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Admin' })[0]).toHaveAttribute('href', '/admin');
  });

  it('toggles the mobile menu on click', async () => {
    const user = userEvent.setup();
    await renderHeaderWithInfo({ userLabel: null, userKind: null, isAdminUser: false });
    const trigger = screen.getByRole('button', { name: 'Menü öffnen' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Menü schließen' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
