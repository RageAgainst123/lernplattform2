import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HangmanBlock } from './HangmanBlock';
import type { HangmanBlock as HangmanBlockType } from '@/lib/schemas/blocks';

// Galgenmännchen: Buchstaben raten über die Bildschirm-Tastatur, begrenzte
// Fehlversuche (Herzen), Wörter nacheinander.

const block: HangmanBlockType = {
  id: 'gal1',
  type: 'hangman',
  instruction: 'Errate die Begriffe.',
  maxWrong: 3,
  words: [{ id: 'w1', word: 'MAUS', hint: 'Eingabegerät zum Klicken' }],
};

function key(letter: string) {
  return screen.getByRole('button', { name: letter });
}

describe('HangmanBlock', () => {
  it('zeigt Hinweis, Maske und Herzen', () => {
    render(<HangmanBlock block={block} answer={[]} checked={false} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Eingabegerät zum Klicken/)).toBeInTheDocument();
    expect(screen.getByText('____')).toBeInTheDocument();
    expect(screen.getByLabelText('3 Versuche übrig')).toBeInTheDocument();
  });

  it('richtige Buchstaben decken auf, letzter Buchstabe löst onAnswer aus', () => {
    const onAnswer = vi.fn();
    render(<HangmanBlock block={block} answer={[]} checked={false} onAnswer={onAnswer} />);
    fireEvent.click(key('M'));
    fireEvent.click(key('A'));
    expect(screen.getByText('MA__')).toBeInTheDocument();
    fireEvent.click(key('U'));
    fireEvent.click(key('S'));
    expect(onAnswer).toHaveBeenCalledWith(['w1']);
  });

  it('falsche Buchstaben kosten Herzen; nach maxWrong ist das Wort verloren', () => {
    render(<HangmanBlock block={block} answer={[]} checked={false} onAnswer={vi.fn()} />);
    fireEvent.click(key('X'));
    expect(screen.getByLabelText('2 Versuche übrig')).toBeInTheDocument();
    fireEvent.click(key('Y'));
    fireEvent.click(key('Z'));
    // Wort verloren → Zusammenfassung mit aufgedecktem Wort (amber).
    expect(screen.getByText('MAUS')).toBeInTheDocument();
    expect(screen.getByText(/0 von 1 Wörtern erraten/)).toBeInTheDocument();
  });

  it('checked: deckt nicht gelöste Wörter auf und sperrt', () => {
    render(<HangmanBlock block={block} answer={[]} checked={true} onAnswer={vi.fn()} />);
    expect(screen.getByText('MAUS')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull(); // keine Tastatur mehr
  });
});
