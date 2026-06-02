// Beamer-Modus: eigenes Layout ohne SiteShell (kein Header, kein Footer).
// Vollbild auf weißem Hintergrund, damit der Klassen-Code aus 5 Meter
// Entfernung gut lesbar ist.

export default function BeamerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
