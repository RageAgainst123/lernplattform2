import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusSummary } from './StatusSummary';

describe('StatusSummary', () => {
  it('renders nothing when all counts are zero', () => {
    const { container } = render(
      <StatusSummary counts={{ open: 0, in_progress: 0, returned: 0, done: 0 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the three labels with counts when all statuses are present', () => {
    render(<StatusSummary counts={{ open: 2, in_progress: 1, returned: 0, done: 4 }} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('offen')).toBeInTheDocument();
    expect(screen.getByText('in Bearbeitung')).toBeInTheDocument();
    expect(screen.getByText('erledigt')).toBeInTheDocument();
  });

  it('omits status segments with count 0', () => {
    render(<StatusSummary counts={{ open: 0, in_progress: 2, returned: 0, done: 1 }} />);
    expect(screen.queryByText('offen')).not.toBeInTheDocument();
    expect(screen.getByText('in Bearbeitung')).toBeInTheDocument();
    expect(screen.getByText('erledigt')).toBeInTheDocument();
  });
});
