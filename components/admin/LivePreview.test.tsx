import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LivePreview } from './LivePreview';
import type { Block } from '@/lib/schemas/blocks';

const TF: Block = {
  id: 'tf1',
  type: 'true_false',
  question: 'Ein Lautsprecher ist ein Eingabegerät.',
  answer: false,
};

const TEXT: Block = { id: 't1', type: 'text', content: 'Nur Theorie.' };

describe('LivePreview', () => {
  it('zeigt Platzhalter ohne Blöcke', () => {
    render(<LivePreview blocks={[]} />);
    expect(screen.getByText(/Vorschau erscheint/)).toBeInTheDocument();
  });

  it('zeigt einen Prüfen-Knopf für bewertbare Blöcke', () => {
    render(<LivePreview blocks={[TF]} />);
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeInTheDocument();
  });

  it('zeigt KEINEN Prüfen-Knopf für nicht bewertbare Blöcke (text)', () => {
    render(<LivePreview blocks={[TEXT]} />);
    expect(screen.queryByRole('button', { name: 'Prüfen' })).not.toBeInTheDocument();
  });

  it('zeigt nach Prüfen ohne Antwort ein Falsch-Ergebnis + Zurücksetzen', () => {
    render(<LivePreview blocks={[TF]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(screen.getByText(/Falsch \(0 %\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurücksetzen' })).toBeInTheDocument();
  });

  it('Zurücksetzen bringt den Prüfen-Knopf zurück', () => {
    render(<LivePreview blocks={[TF]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }));
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeInTheDocument();
  });

  it('wertet eine richtige Antwort als 100 % (richtig) — true_false', () => {
    render(<LivePreview blocks={[TF]} />);
    // Antwort "Falsch" wählen (korrekt für answer:false). Der TrueFalseBlock
    // rendert zwei Optionen; wir klicken die mit "Falsch".
    fireEvent.click(screen.getByRole('button', { name: /Falsch/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(screen.getByText(/Richtig \(100 %\)/)).toBeInTheDocument();
  });
});
