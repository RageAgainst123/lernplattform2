'use client';

import { cn } from '@/lib/utils';

// Begriffs-Pool unter dem Bild: die noch nicht zugeordneten Begriffe als Chips.
// Ist eine Zone aktiv (armed), wird der Klick auf einen Chip ihr zugeordnet.
// `activeHint` = z.B. „Stelle 2" → Hinweis „Welcher Begriff gehört zu Stelle 2?".

export function LabelPool({
  labels,
  armed,
  activeHint,
  onPick,
}: {
  labels: string[]; // noch nicht zugeordnete Begriffe
  armed: boolean; // eine Zone ist aktiv → Chips sind Ablege-Aktion
  activeHint: string | null;
  onPick: (label: string) => void;
}) {
  return (
    <div className="space-y-2">
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(label)}
              className={cn(
                'rounded-full border px-4 py-2 text-base font-medium transition-colors',
                armed
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm hover:opacity-90'
                  : 'border-input bg-background hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Alle Begriffe zugeordnet. ✓</p>
      )}
      {activeHint && (
        <p className="text-primary text-sm font-medium">Welcher Begriff gehört zu {activeHint}?</p>
      )}
    </div>
  );
}
