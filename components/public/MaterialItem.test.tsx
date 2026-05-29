import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaterialItem } from './MaterialItem';
import type { PublicMaterial } from '@/lib/db/public-content';

function mat(overrides: Partial<PublicMaterial> = {}): PublicMaterial {
  return {
    id: 'm1',
    title: 'Arbeitsblatt',
    description: null,
    materialType: 'arbeitsblatt',
    fileUrl: 'https://example/m1.pdf',
    relatedModuleId: null,
    ...overrides,
  };
}

describe('MaterialItem', () => {
  it('shows only PDF download when no related module', () => {
    render(<MaterialItem material={mat()} />);
    expect(screen.getByRole('link', { name: /PDF herunterladen/ })).toBeInTheDocument();
    expect(screen.queryByText(/Online ausfüllen/)).not.toBeInTheDocument();
  });

  it('shows lock hint when related module exists but student is not logged in', () => {
    render(<MaterialItem material={mat({ relatedModuleId: 'mod-1' })} />);
    expect(screen.getByText(/mit Klassencode anmelden/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Online ausfüllen/ })).not.toBeInTheDocument();
  });

  it('shows online-fill button when related module exists AND student is logged in', () => {
    render(<MaterialItem material={mat({ relatedModuleId: 'mod-1' })} studentLoggedIn />);
    const link = screen.getByRole('link', { name: /Online ausfüllen/ });
    expect(link).toHaveAttribute('href', '/s/modul/mod-1');
  });

  it('does NOT show online-fill button when student logged in but no related module', () => {
    render(<MaterialItem material={mat()} studentLoggedIn />);
    expect(screen.queryByRole('link', { name: /Online ausfüllen/ })).not.toBeInTheDocument();
  });
});
