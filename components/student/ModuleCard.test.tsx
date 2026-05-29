import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleCard } from './ModuleCard';
import type { AssignedModule } from '@/lib/db/student-modules';

function build(status: AssignedModule['status']): AssignedModule {
  return {
    id: 'm1',
    title: 'EVA-Prinzip',
    description: 'Eingabe – Verarbeitung – Ausgabe',
    status,
  };
}

describe('ModuleCard', () => {
  it('renders title and description linked to the module page', () => {
    render(<ModuleCard module={build('open')} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/s/modul/m1');
    expect(screen.getByText('EVA-Prinzip')).toBeInTheDocument();
    expect(screen.getByText('Eingabe – Verarbeitung – Ausgabe')).toBeInTheDocument();
  });

  it('shows no status badge when status is open', () => {
    render(<ModuleCard module={build('open')} />);
    expect(screen.queryByText('In Bearbeitung')).not.toBeInTheDocument();
    expect(screen.queryByText('Erledigt')).not.toBeInTheDocument();
  });

  it('shows an „In Bearbeitung" badge when status is in_progress', () => {
    render(<ModuleCard module={build('in_progress')} />);
    expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
  });

  it('shows an „Erledigt" badge when status is done', () => {
    render(<ModuleCard module={build('done')} />);
    expect(screen.getByText('Erledigt')).toBeInTheDocument();
  });
});
