import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Erklärtext-Liste, die NACH dem Prüfen unter dem Hotspot-Bild erscheint. Zeigt
// pro Zone mit gesetztem `feedback` einen kurzen Text, farbig nach richtig
// (grün ✓) / Ablenker (rot ✗). Optional auf eine Zonen-Teilmenge beschränkt
// (Gruppen-Review: nur die Zonen des aktuellen Schritts).

type Area = HotspotBlockType['areas'][number];

export function HotspotFeedbackList({ areas }: { areas: Area[] }) {
  const withText = areas.filter((a) => a.feedback && a.feedback.trim().length > 0);
  if (withText.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {withText.map((a) => (
        <li
          key={a.id}
          className={cn(
            'flex items-start gap-2 rounded-md border p-2 text-sm',
            a.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          )}
        >
          <span aria-hidden className={a.isCorrect ? 'text-green-700' : 'text-red-700'}>
            {a.isCorrect ? '✓' : '✗'}
          </span>
          <span>
            {a.label && <strong className="mr-1">{a.label}:</strong>}
            {a.feedback}
          </span>
        </li>
      ))}
    </ul>
  );
}
