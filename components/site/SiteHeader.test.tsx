import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from './SiteHeader';

// next/navigation usePathname() braucht einen Stub in jsdom
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('SiteHeader', () => {
  it('renders the brand logo as a link to the homepage', () => {
    render(<SiteHeader />);
    const logo = screen.getByRole('link', { name: /Startseite/i });
    expect(logo).toHaveAttribute('href', '/');
  });

  it('renders the main navigation links on desktop', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'Materialien' })).toHaveAttribute('href', '/dgb');
    expect(screen.getByRole('link', { name: /Schüler:innen-Login/ })).toHaveAttribute('href', '/k');
    expect(screen.getByRole('link', { name: /Lehrer:innen-Login/ })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('toggles the mobile menu on click', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const trigger = screen.getByRole('button', { name: 'Menü öffnen' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Menü schließen' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
