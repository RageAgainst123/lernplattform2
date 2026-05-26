import type { GeneratedCode } from '@/lib/db/student-code-actions';

// Einmalige Anzeige frisch generierter Klartext-PINs. Nach dem Neuladen sind die
// PINs nicht mehr abrufbar (nur gehasht gespeichert) — daher der Notier-Hinweis.
export function GeneratedPinsNotice({ codes }: { codes: GeneratedCode[] }) {
  if (codes.length === 0) {
    return null;
  }
  return (
    <div className="border-primary/40 bg-primary/5 rounded-md border p-4">
      <p className="mb-3 text-sm font-medium">
        Bitte jetzt notieren oder ausdrucken — die PINs werden danach nicht mehr angezeigt.
      </p>
      <ul className="grid grid-cols-2 gap-1 font-mono text-sm sm:grid-cols-3">
        {codes.map((code) => (
          <li key={code.codename} className="flex justify-between gap-2">
            <span>{code.codename}</span>
            <span className="font-semibold">{code.pin}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
