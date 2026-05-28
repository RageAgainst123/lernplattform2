import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from './SiteFooter';
import { BRAND } from '@/lib/brand';

describe('SiteFooter', () => {
  it('renders the legal links', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum');
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute(
      'href',
      '/datenschutz'
    );
  });

  it('renders the contact email as mailto link', () => {
    render(<SiteFooter />);
    const link = screen.getByRole('link', { name: BRAND.contactEmail });
    expect(link).toHaveAttribute('href', `mailto:${BRAND.contactEmail}`);
  });

  it('renders the copyright line with the brand name and current year', () => {
    render(<SiteFooter />);
    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(`${year}.*${BRAND.name}`))).toBeInTheDocument();
  });
});
