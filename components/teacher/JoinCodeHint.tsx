import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

// Zeigt der Lehrer:in den Beitrittscode + Beamer-Button für den Stunden-Einstieg.
export function JoinCodeHint({ joinCode, classId }: { joinCode: string; classId: string }) {
  return (
    <div className="bg-muted/50 flex flex-col gap-3 rounded-md border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-muted-foreground">Klassen-Code: </span>
        <span className="font-mono text-base font-semibold tracking-wider">{joinCode}</span>
        <p className="text-muted-foreground mt-1">
          Schüler:innen tippen ihn nach Microsoft-Login (oder direkt mit PIN) ein.
        </p>
      </div>
      <Link
        href={`/lehrer/klassen/${classId}/beamer`}
        target="_blank"
        rel="noopener"
        className={`${buttonVariants({ variant: 'default' })} shrink-0`}
      >
        📺 Code am Beamer zeigen
      </Link>
    </div>
  );
}
