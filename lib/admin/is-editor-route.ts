// Erkennt, ob ein Pfad eine Modul-Editor-Route ist (Lernmodul/Präsentation/
// Quiz/Abschlusstest bearbeiten oder neu). Diese Seiten rendern alle den
// <ModuleEditor> und sollen im Admin-Bereich breit + ohne Sidebar dargestellt
// werden. Material ist KEIN ModuleEditor → nicht enthalten.
//
// Pure Funktion (kein React) → unit-testbar.

const EDITOR_SECTIONS = ['lernmodule', 'praesentationen', 'quizze', 'abschlusstests'] as const;

// Match: /admin/<section>/<segment> wobei segment 'neu' oder eine ID ist
// (nicht leer). Die Listen-Route /admin/<section> selbst matcht NICHT.
export function isEditorRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const parts = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
  // ['admin', '<section>', '<segment>', ...]
  if (parts.length < 3 || parts[0] !== 'admin') return false;
  if (!(EDITOR_SECTIONS as readonly string[]).includes(parts[1])) return false;
  return parts[2].length > 0;
}
