import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordHeftMatrix } from './WordHeftMatrix';
import type { StudentCode, WordHeftLink } from '@/lib/schemas/entities';

// V7: „zuletzt geöffnet" pro Zeile (amber bei >21 Tagen/nie) + Header-Pill
// „{n} ohne Heft".

function code(id: string, email: string | null): StudentCode {
  return {
    id,
    classId: 'c-1',
    codename: `5T-${id}`,
    createdAt: '2026-06-01T10:00:00Z',
    lastActiveAt: null,
    givenName: email ? 'Anna' : null,
    surname: email ? 'Muster' : null,
    o365Email: email,
  };
}

function link(studentCodeId: string, lastOpenedAt: string | null): WordHeftLink {
  return {
    id: `l-${studentCodeId}`,
    studentCodeId,
    topicId: null,
    oneDriveUrl: 'https://nms-my.sharepoint.com/x.docx',
    displayName: 'Mein Heft',
    validationStatus: 'ok',
    lastValidatedAt: '2026-06-01T10:00:00Z',
    lastOpenedAt,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  };
}

describe('WordHeftMatrix — Reporting (V7)', () => {
  it('zeigt „zuletzt geöffnet" pro Heft (heute / noch nie)', () => {
    render(
      <WordHeftMatrix
        codes={[code('s1', 'a@nms.at'), code('s2', 'b@nms.at')]}
        links={[link('s1', new Date().toISOString()), link('s2', null)]}
        isTeacherSsoAuth
      />
    );
    expect(screen.getByText(/zuletzt geöffnet: heute/)).toBeInTheDocument();
    expect(screen.getByText(/zuletzt geöffnet: noch nie geöffnet/)).toBeInTheDocument();
  });

  it('zeigt Pill „{n} ohne Heft" wenn SSO-Schüler:innen ohne Link existieren', () => {
    render(
      <WordHeftMatrix
        codes={[code('s1', 'a@nms.at'), code('s2', 'b@nms.at'), code('s3', 'c@nms.at')]}
        links={[link('s1', null)]}
        isTeacherSsoAuth
      />
    );
    expect(screen.getByText('2 ohne Heft')).toBeInTheDocument();
  });

  it('keine Pill wenn alle ein Heft haben', () => {
    render(
      <WordHeftMatrix
        codes={[code('s1', 'a@nms.at')]}
        links={[link('s1', null)]}
        isTeacherSsoAuth
      />
    );
    expect(screen.queryByText(/ohne Heft/)).toBeNull();
  });
});
