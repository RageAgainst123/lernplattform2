import { LiveOverlay } from '@/components/student/LiveOverlay';

// Layout für den gesamten Schüler:innen-Bereich (/s/*). Rendert die normale
// Seite plus das Live-Overlay, das während einer Lehrer:innen-Präsentation
// erscheint (Dimmen / Live-Poll). So greift das Overlay auf allen /s-Seiten —
// auch wenn ein Kind gerade in einem Modul arbeitet.
export default function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LiveOverlay />
    </>
  );
}
