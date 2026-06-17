import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// V6: Lösch-Bestätigung nennt die Anzahl der Klassen-Zuweisungen, damit Geo
// nicht versehentlich einen aktiven Lernpfad unter den Schüler:innen wegzieht.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
const deleteTopic = vi.fn();
vi.mock('@/lib/db/topic-actions', () => ({
  createTopic: vi.fn(),
  updateTopic: vi.fn(),
  deleteTopic: (...args: unknown[]) => deleteTopic(...args),
}));

import { TopicEditor } from './TopicEditor';
import type { TopicFormValue } from './TopicForm';

const value: TopicFormValue = {
  slug: 'eva',
  label: 'EVA-Prinzip',
  description: '',
  schulstufe: 5,
  kompetenzbereich: null,
  isPublished: true,
  sortOrder: 1,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TopicEditor — Lösch-Warnung (V6)', () => {
  it('nennt die Klassen-Anzahl in der Bestätigung', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<TopicEditor topicId="t-1" initialValue={value} assignedClassCount={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('2 Klasse(n) zugewiesen'));
    expect(deleteTopic).not.toHaveBeenCalled(); // Abbrechen → kein Delete
  });

  it('ohne Zuweisungen bleibt die Bestätigung neutral', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<TopicEditor topicId="t-1" initialValue={value} assignedClassCount={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(confirmSpy).toHaveBeenCalledWith(expect.not.stringContaining('Klasse(n)'));
  });
});
