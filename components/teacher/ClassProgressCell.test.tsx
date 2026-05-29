import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassProgressCell } from './ClassProgressCell';
import type { ProgressCell } from '@/lib/db/class-progress';

function cell(overrides: Partial<ProgressCell>): ProgressCell {
  return {
    studentCodeId: 's1',
    moduleId: 'm1',
    status: 'open',
    score: null,
    maxScore: null,
    lastActivityAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe('ClassProgressCell', () => {
  it('renders an "offen" label for open cells', () => {
    render(<ClassProgressCell cell={cell({ status: 'open' })} />);
    expect(screen.getByText('offen')).toBeInTheDocument();
  });

  it('renders a "Begonnen" label for in_progress cells', () => {
    render(
      <ClassProgressCell
        cell={cell({ status: 'in_progress', lastActivityAt: '2026-05-29T12:00:00Z' })}
      />
    );
    expect(screen.getByText('Begonnen')).toBeInTheDocument();
  });

  it('renders a "Fertig" label for done cells', () => {
    render(
      <ClassProgressCell cell={cell({ status: 'done', completedAt: '2026-05-29T12:00:00Z' })} />
    );
    expect(screen.getByText('Fertig')).toBeInTheDocument();
  });

  it('shows score N/M for done cells with max_score', () => {
    render(
      <ClassProgressCell
        cell={cell({ status: 'done', completedAt: '2026-05-29T12:00:00Z', score: 4, maxScore: 5 })}
      />
    );
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('omits the score when max_score is null', () => {
    render(
      <ClassProgressCell
        cell={cell({
          status: 'done',
          completedAt: '2026-05-29T12:00:00Z',
          score: 3,
          maxScore: null,
        })}
      />
    );
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
  });
});
