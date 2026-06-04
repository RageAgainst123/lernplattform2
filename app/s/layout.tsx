import Link from 'next/link';
import { LiveOverlay } from '@/components/student/LiveOverlay';
import { getStudentSession } from '@/lib/auth/student-auth';

// Layout für den gesamten Schüler:innen-Bereich (/s/*). Rendert die normale
// Seite plus das Live-Overlay, das während einer Lehrer:innen-Präsentation
// erscheint (Dimmen / Live-Poll). So greift das Overlay auf allen /s-Seiten —
// auch wenn ein Kind gerade in einem Modul arbeitet.
//
// Phase H1: dünner Schüler-Header mit Link zum Heft. Wir haben bewusst
// keinen großen Site-Header im Schülerbereich (würde mit dem Modul-Runner
// kollidieren). Nur ein einfaches Banner mit dem Heft-Link.
//
// Phase T5: classId aus jose-Session wird an LiveOverlay weitergereicht,
// damit useLiveSync den richtigen Realtime-Channel abonnieren kann
// (live_session:{classId}).

export default async function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  return (
    <>
      <div className="bg-background border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-2">
          <Link href="/s" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link
            href="/s/heft"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm hover:underline"
          >
            <span aria-hidden>📓</span>
            Mein Heft
          </Link>
        </div>
      </div>
      {children}
      <LiveOverlay classId={session?.classId ?? null} />
    </>
  );
}
