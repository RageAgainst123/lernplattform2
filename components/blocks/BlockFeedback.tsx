import type { Block } from '@/lib/schemas/blocks';
import { cn } from '@/lib/utils';

// Zeigt nach dem Prüfen die Rückmeldung (grün/rot) inkl. block-spezifischer
// Erklärung, falls hinterlegt.
export function BlockFeedback({ block, correct }: { block: Block; correct: boolean }) {
  let explanation: string | undefined;
  if (block.type === 'multiple_choice' || block.type === 'true_false') {
    explanation = correct ? block.feedbackCorrect : block.feedbackWrong;
  }

  return (
    <div
      className={cn(
        'rounded-md border p-3 text-base',
        correct
          ? 'border-green-600 bg-green-50 text-green-800'
          : 'border-red-600 bg-red-50 text-red-800'
      )}
      role="status"
    >
      <p className="font-medium">{correct ? 'Richtig!' : 'Noch nicht richtig.'}</p>
      {explanation && <p className="mt-1">{explanation}</p>}
    </div>
  );
}
