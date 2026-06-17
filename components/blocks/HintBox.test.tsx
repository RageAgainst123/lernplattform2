import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintBox } from './HintBox';

describe('HintBox (Phase W)', () => {
  it('rendert kollabiert per Default (Hinweis verborgen)', () => {
    render(<HintBox hint="Denke an die EVA-Phasen." />);
    expect(screen.getByRole('button', { name: /Hinweis anzeigen/i })).toBeInTheDocument();
    expect(screen.queryByText('Denke an die EVA-Phasen.')).toBeNull();
  });

  it('zeigt Hinweistext nach Klick', () => {
    render(<HintBox hint="Denke an die EVA-Phasen." />);
    fireEvent.click(screen.getByRole('button', { name: /Hinweis anzeigen/i }));
    expect(screen.getByText('Denke an die EVA-Phasen.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hinweis verbergen/i })).toBeInTheDocument();
  });

  it('zeigt verbleibende Versuche-Anzeige, wenn attemptsLeft > 0', () => {
    render(<HintBox hint="Tipp." attemptsLeft={2} />);
    expect(screen.getByText(/noch 2 Versuche/i)).toBeInTheDocument();
  });

  it('verwendet Singular für 1 verbleibenden Versuch', () => {
    render(<HintBox hint="Tipp." attemptsLeft={1} />);
    expect(screen.getByText(/noch 1 Versuch$/i)).toBeInTheDocument();
  });

  it('blendet attemptsLeft aus, wenn 0 (letzter Versuch verbraucht)', () => {
    render(<HintBox hint="Tipp." attemptsLeft={0} />);
    expect(screen.queryByText(/noch \d+ Versuch/i)).toBeNull();
  });

  it('ist a11y-zugänglich (aria-expanded auf Toggle-Button)', () => {
    render(<HintBox hint="Tipp." />);
    const button = screen.getByRole('button', { name: /Hinweis anzeigen/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
