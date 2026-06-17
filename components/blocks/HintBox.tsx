'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// Phase W (2026-06): kollabierbare Hinweis-Box. Erscheint im ModuleRunner,
// wenn Schüler:in nach einer falschen Antwort einen weiteren Versuch hat
// und der Block einen `hint` definiert hat.
//
// Standardmäßig zugeklappt (didaktisch: erst nachdenken, dann Hinweis).
// Ein Klick auf den Button blendet den Text auf — ohne Layout-Sprung,
// weil der Container immer da ist.

type Props = {
  hint: string;
  // Optional: Restversuche-Anzeige (z.B. „1 von 3 Versuchen übrig").
  attemptsLeft?: number;
};

export function HintBox({ hint, attemptsLeft }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn('rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900')}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 font-medium hover:underline"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>💡</span>
          {open ? 'Hinweis verbergen' : 'Hinweis anzeigen'}
        </span>
        {attemptsLeft !== undefined && attemptsLeft > 0 && (
          <span className="text-xs text-amber-700">
            noch {attemptsLeft} {attemptsLeft === 1 ? 'Versuch' : 'Versuche'}
          </span>
        )}
      </button>
      {open && <p className="mt-2">{hint}</p>}
    </div>
  );
}
