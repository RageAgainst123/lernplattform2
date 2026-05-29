import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleAssignmentPanel } from './ModuleAssignmentPanel';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { PublishedModuleOption } from '@/lib/db/modules';

// useRouter stubben — useTransition + router.refresh sind keine Test-Targets.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Server-Actions sind hier irrelevant — wir testen nur die Render-Logik.
vi.mock('@/lib/db/class-module-actions', () => ({
  assignModuleToClass: vi.fn(),
  unassignModuleFromClass: vi.fn(),
}));

const EVA: AssignedModuleForTeacher = {
  moduleId: 'eva',
  title: 'Das EVA-Prinzip',
  description: null,
  schulstufe: 5,
  topic: 'EVA-Prinzip',
  displayMode: 'worksheet',
  dueDate: null,
  assignedAt: '2026-05-29T00:00:00Z',
};

const SUCHEN: PublishedModuleOption = { id: 'suchen', title: 'Suchen im Internet', schulstufe: 5 };

describe('ModuleAssignmentPanel', () => {
  it('shows the empty state when no modules are assigned', () => {
    render(<ModuleAssignmentPanel classId="c1" assigned={[]} available={[SUCHEN]} />);
    expect(screen.getByText(/noch kein Modul zugewiesen/i)).toBeInTheDocument();
  });

  it('lists assigned modules', () => {
    render(<ModuleAssignmentPanel classId="c1" assigned={[EVA]} available={[SUCHEN]} />);
    expect(screen.getByText('Das EVA-Prinzip')).toBeInTheDocument();
    expect(screen.getByText(/zugewiesene Module \(1\)/i)).toBeInTheDocument();
  });

  it('hides already assigned modules from the dropdown choices', () => {
    render(
      <ModuleAssignmentPanel
        classId="c1"
        assigned={[EVA]}
        available={[{ id: 'eva', title: 'Das EVA-Prinzip', schulstufe: 5 }, SUCHEN]}
      />
    );
    const select = screen.getByLabelText(/Modul auswählen/i) as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent ?? '');
    expect(optionTexts.some((t) => t.includes('Suchen im Internet'))).toBe(true);
    // EVA NICHT in den Choices (steht nur als platzhaltere null + Suchen).
    expect(optionTexts.filter((t) => t.includes('EVA'))).toHaveLength(0);
  });

  it('shows a hint when all available modules are already assigned', () => {
    render(
      <ModuleAssignmentPanel
        classId="c1"
        assigned={[EVA]}
        available={[{ id: 'eva', title: 'Das EVA-Prinzip', schulstufe: 5 }]}
      />
    );
    expect(screen.getByText(/alle veröffentlichten Module sind zugewiesen/i)).toBeInTheDocument();
  });

  it('shows the due date when set', () => {
    render(
      <ModuleAssignmentPanel
        classId="c1"
        assigned={[{ ...EVA, dueDate: '2026-06-15' }]}
        available={[]}
      />
    );
    expect(screen.getByText(/fällig: 15\.06\.2026/)).toBeInTheDocument();
  });
});
