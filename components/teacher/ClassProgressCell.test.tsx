import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassProgressCell } from '@/components/teacher/ClassProgressCell';
import type { ProgressCell } from '@/lib/db/class-progress';

// Smoke-Tests für die Zell-Darstellung: korrekte Badges + Score-Anzeige je
// Status, inkl. bestanden/nicht-bestanden + Rückgabe. Datum-Tooltip via title.

function makeCell(overrides: Partial<ProgressCell>): ProgressCell {
  return {
    studentCodeId: 's1',
    moduleId: 'm1',
    status: 'open',
    score: null,
    maxScore: null,
    lastActivityAt: null,
    completedAt: null,
    returnedAt: null,
    passed: null,
    passThreshold: null,
    hasFeedback: false,
    ...overrides,
  };
}

describe('ClassProgressCell', () => {
  it('renders the open state', () => {
    render(<ClassProgressCell cell={makeCell({ status: 'open' })} classId="c1" />);
    expect(screen.getByText('offen')).toBeInTheDocument();
  });

  it('renders in_progress with a pencil + label', () => {
    render(<ClassProgressCell cell={makeCell({ status: 'in_progress' })} classId="c1" />);
    expect(screen.getByText('Begonnen')).toBeInTheDocument();
  });

  it('renders done (no threshold) with score when maxScore present', () => {
    render(
      <ClassProgressCell
        cell={makeCell({
          status: 'done',
          score: 3,
          maxScore: 4,
          completedAt: '2026-05-29T10:00:00Z',
        })}
        classId="c1"
      />
    );
    expect(screen.getByText('Fertig')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('renders "Bestanden" when passed is true', () => {
    render(
      <ClassProgressCell
        cell={makeCell({ status: 'done', score: 4, maxScore: 5, passed: true, passThreshold: 80 })}
        classId="c1"
      />
    );
    expect(screen.getByText('Bestanden')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('renders "Nicht bestanden" when passed is false', () => {
    render(
      <ClassProgressCell
        cell={makeCell({ status: 'done', score: 2, maxScore: 5, passed: false, passThreshold: 80 })}
        classId="c1"
      />
    );
    expect(screen.getByText('Nicht bestanden')).toBeInTheDocument();
  });

  it('renders the returned state', () => {
    render(
      <ClassProgressCell
        cell={makeCell({ status: 'returned', returnedAt: '2026-05-30T08:00:00Z' })}
        classId="c1"
      />
    );
    expect(screen.getByText('Zurückgegeben')).toBeInTheDocument();
  });

  it('links to the submission detail page for non-open cells', () => {
    render(
      <ClassProgressCell
        cell={makeCell({ studentCodeId: 'stud9', moduleId: 'mod9', status: 'done' })}
        classId="cls9"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/lehrer/klassen/cls9/fortschritt/stud9/mod9');
  });
});
