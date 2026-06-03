import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getQuizBannerForStudent } from '@/lib/db/quiz-sessions';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Quiz-Lobby — Lernplattform',
};

// Schüler:innen-Wait-Page nach dem Beitritt zu einem Live-Quiz (S1.E).
// Zeigt „Warte auf Start…" bis Lehrer:in das Quiz startet. Echte Live-
// Synchronisation (Auto-Weiterleitung zur Frage-Phase) folgt in S1.C +
// S2 — heute manueller Refresh.
//
// sessionId aus der URL ist nur ein Hint — die echte Quote „läuft gerade
// ein Quiz?" kommt server-seitig über die jose-Session + classId. Damit
// kann niemand einer fremden Session per ID-Rate beitreten.

export default async function StudentQuizLobbyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await requireStudentSession();
  await params; // sessionId wird heute nicht gebraucht — Quote läuft über classId
  const banner = await getQuizBannerForStudent(session.classId, session.studentCodeId);
  if (!banner) redirect('/s');
  if (!banner.alreadyJoined) redirect('/s');
  return <LobbyView moduleTitle={banner.moduleTitle} status={banner.status} />;
}

function LobbyView({ moduleTitle, status }: { moduleTitle: string; status: 'lobby' | 'active' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🎮 {moduleTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'lobby' ? <WaitingMessage /> : <RunningMessage />}
          <Link href="/s" className={`${buttonVariants({ variant: 'outline' })} w-full`}>
            Zurück zum Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function WaitingMessage() {
  return (
    <>
      <div className="rounded-md border-2 border-violet-300 bg-violet-50 p-4 text-center">
        <p className="text-sm text-violet-900">⏳ Warte auf Start…</p>
        <p className="mt-1 text-xs text-violet-700">
          Sobald deine Lehrer:in das Quiz startet, geht es los.
        </p>
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Du bist beigetreten. (Sprint S1.C wird das automatisch aktualisieren — heute bitte manuell
        die Seite neu laden.)
      </p>
    </>
  );
}

function RunningMessage() {
  return (
    <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
      <p className="font-medium text-emerald-900">✓ Das Quiz läuft</p>
      <p className="mt-1 text-xs text-emerald-800">
        Die Frage-Phase folgt in Sprint S2 — bald sind hier die Fragen 🚀
      </p>
    </div>
  );
}
