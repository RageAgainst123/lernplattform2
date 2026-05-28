import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopicBadges } from './TopicBadges';

describe('TopicBadges', () => {
  it('renders nothing when both counts are zero', () => {
    const { container } = render(<TopicBadges materialCount={0} moduleCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only the material badge when there are no modules', () => {
    render(<TopicBadges materialCount={2} moduleCount={0} />);
    const wrapper = screen.getByLabelText('2 Materialien');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.textContent).toContain('2');
    expect(wrapper.textContent).not.toMatch(/Modul/);
  });

  it('uses singular wording for count 1', () => {
    render(<TopicBadges materialCount={1} moduleCount={1} />);
    expect(screen.getByLabelText('1 Material, 1 Modul')).toBeInTheDocument();
  });

  it('combines both labels for plural counts', () => {
    render(<TopicBadges materialCount={3} moduleCount={2} />);
    expect(screen.getByLabelText('3 Materialien, 2 Module')).toBeInTheDocument();
  });
});
