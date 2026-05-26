import type { GeneratedCode } from '@/lib/db/student-code-actions';
import { CodeListDownloadButton } from '@/components/teacher/CodeListDownloadButton';

type Props = { codes: GeneratedCode[]; className: string };

// Einmalige Anzeige frisch generierter Klartext-PINs. Nach dem Neuladen sind die
// PINs nicht mehr abrufbar (nur gehasht gespeichert) — daher der Notier-Hinweis.
export function GeneratedPinsNotice({ codes, className }: Props) {
  if (codes.length === 0) {
    return null;
  }
  return (
    <div className="border-primary/40 bg-primary/5 rounded-md border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">
          Bitte jetzt notieren, herunterladen oder ausdrucken — die PINs werden danach nicht mehr
          angezeigt.
        </p>
        <CodeListDownloadButton className={className} codes={codes} />
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {codes.map((code) => (
          <li
            key={code.codename}
            className="bg-background flex items-baseline justify-between gap-3 rounded-md border px-3 py-2"
          >
            <span className="text-muted-foreground font-mono text-xs">{code.codename}</span>
            <span className="font-mono text-base font-semibold tracking-wider">{code.pin}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
