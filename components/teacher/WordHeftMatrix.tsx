'use client';

import { useState } from 'react';
import type { WordHeftLink, StudentCode, ValidationStatus } from '@/lib/schemas/entities';
import { studentDisplayName } from '@/lib/db/student-display-name';
import { daysSince, formatRelativeDe } from '@/lib/utils/relative-time';

// Phase Q5: Klassen-Word-Heft-Übersicht für Lehrer:innen.
//
// Tabelle mit allen Schüler:innen die ein Word-Heft angelegt haben.
// Klick auf "Heft öffnen" → window.open in neuem Tab → Word-Web rendert
// die Datei aus dem OneDrive der Schüler:in.
//
// Wichtig: Lehrer:in MUSS im selben Browser auch mit Microsoft eingeloggt
// sein, sonst kommt der OAuth-Redirect von Microsoft. Beim ersten Klick
// zeigen wir einen Hinweis.

export type WordHeftMatrixProps = {
  codes: StudentCode[];
  links: WordHeftLink[];
  isTeacherSsoAuth: boolean;
};

type Row = {
  code: StudentCode;
  link: WordHeftLink | null;
};

function buildRows(codes: StudentCode[], links: WordHeftLink[]): Row[] {
  const byStudent = new Map(links.map((l) => [l.studentCodeId, l]));
  return codes
    .map((code) => ({ code, link: byStudent.get(code.id) ?? null }))
    .sort((a, b) => Number(Boolean(b.link)) - Number(Boolean(a.link)));
}

function StatusLabel({ status }: { status: ValidationStatus }) {
  if (status === 'ok') return <span className="text-xs text-green-700">✅</span>;
  if (status === 'broken') return <span className="text-destructive text-xs">⚠️ defekt</span>;
  return <span className="text-muted-foreground text-xs">?</span>;
}

function MagicLinkHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
      <div>
        <strong>Hinweis:</strong> Du bist mit Magic-Link angemeldet. Um Word-Hefte von Schüler:innen
        aus anderen Schulen zu öffnen, melde dich zusätzlich mit deinem Microsoft-Schul-Konto an
        (Logout + neu einloggen). Bei Schüler:innen aus deiner eigenen Schule funktioniert es auch
        ohne — du wirst dann beim Klick von Microsoft zum Login weitergeleitet.
      </div>
      <button type="button" onClick={onDismiss} className="text-amber-700 hover:underline">
        ✕
      </button>
    </div>
  );
}

function MatrixRow({ row }: { row: Row }) {
  const name = studentDisplayName(row.code);
  if (!row.link) {
    return (
      <li className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
        <span className="text-foreground text-sm">{name}</span>
        <span className="text-muted-foreground text-xs">— noch kein Heft angelegt</span>
      </li>
    );
  }
  // V7: „zuletzt geöffnet" pro Heft — amber wenn >21 Tage oder nie, damit
  // die Lehrer:in inaktive Hefte auf einen Blick sieht.
  const days = daysSince(row.link.lastOpenedAt);
  const stale = days === null || days > 21;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm">{name}</span>
        <StatusLabel status={row.link.validationStatus} />
        <span className={`text-xs ${stale ? 'text-amber-700' : 'text-muted-foreground'}`}>
          zuletzt geöffnet: {formatRelativeDe(row.link.lastOpenedAt)}
        </span>
      </div>
      <a
        href={row.link.oneDriveUrl}
        target="_blank"
        rel="noopener"
        className="text-primary text-sm hover:underline"
      >
        📓 Heft öffnen
      </a>
    </li>
  );
}

export function WordHeftMatrix(props: WordHeftMatrixProps) {
  const [hintDismissed, setHintDismissed] = useState(false);
  const rows = buildRows(props.codes, props.links);
  const ssoCodes = props.codes.filter((c) => c.o365Email);

  if (ssoCodes.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Schüler:innen mit Microsoft-Login. Sobald welche per O365 beitreten und ein
        Word-Heft anlegen, erscheinen sie hier.
      </p>
    );
  }

  const linkCount = props.links.length;

  return (
    <div className="flex flex-col gap-3">
      {!props.isTeacherSsoAuth && !hintDismissed && (
        <MagicLinkHint onDismiss={() => setHintDismissed(true)} />
      )}
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        {linkCount} von {ssoCodes.length} Schüler:innen haben ein Word-Heft angelegt.
        {ssoCodes.length - linkCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            {ssoCodes.length - linkCount} ohne Heft
          </span>
        )}
      </p>
      <ul className="rounded-md border px-4">
        {rows
          .filter((r) => r.code.o365Email)
          .map((r) => (
            <MatrixRow key={r.code.id} row={r} />
          ))}
      </ul>
    </div>
  );
}
