'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { leaveClass } from '@/lib/db/student-leave-action';
import { studentLogout } from '@/lib/auth/student-actions';

// Einstellungs-Dropdown im Header für Schüler:innen.
// Pragmatischer Click-Outside-Handler statt voller shadcn-DropdownMenu —
// wir brauchen nur 2 Aktionen (Klasse verlassen, Abmelden), das rechtfertigt
// keine neue Radix-Dependency.
//
// Sicherheit:
//   - "Klasse verlassen" hat 2-Schritt-Bestätigung (anderer Zustand im Menü)
//   - Klasse verlassen → leaveClass-Server-Action → DB-Cascade + Cookie weg
//   - Abmelden → studentLogout (jose-Cookie löschen)

type Mode = 'closed' | 'open' | 'confirm-leave';

function MenuItems({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="bg-popover absolute right-0 z-50 mt-1 w-56 rounded-md border p-1 shadow-md">
      <button
        type="button"
        onClick={onLeave}
        className="text-foreground hover:bg-muted block w-full rounded-sm px-3 py-2 text-left text-sm"
      >
        🚪 Klasse verlassen
      </button>
      <form action={studentLogout}>
        <button
          type="submit"
          className="text-foreground hover:bg-muted block w-full rounded-sm px-3 py-2 text-left text-sm"
        >
          👋 Abmelden
        </button>
      </form>
    </div>
  );
}

function ConfirmLeave({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-popover absolute right-0 z-50 mt-1 w-72 rounded-md border p-3 shadow-md">
      <p className="text-foreground mb-3 text-sm">
        Wirklich diese Klasse verlassen? Dein Lern-Fortschritt geht verloren.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {pending ? 'Verlasse …' : 'Ja, verlassen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  close: () => void
) {
  useEffect(() => {
    if (!active) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [active, ref, close]);
}

export function StudentSettingsMenu({ displayName }: { displayName: string }) {
  const [mode, setMode] = useState<Mode>('closed');
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);
  useClickOutside(ref, mode !== 'closed', () => setMode('closed'));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setMode(mode === 'closed' ? 'open' : 'closed')}
        className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
        aria-haspopup="menu"
        aria-expanded={mode !== 'closed'}
      >
        <span className="text-foreground font-medium">{displayName}</span>
        <span aria-hidden>⚙️</span>
      </button>
      {mode === 'open' && <MenuItems onLeave={() => setMode('confirm-leave')} />}
      {mode === 'confirm-leave' && (
        <ConfirmLeave
          pending={pending}
          onConfirm={() => startTransition(() => leaveClass())}
          onCancel={() => setMode('open')}
        />
      )}
    </div>
  );
}
