'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizLobbyPoll } from '@/components/quiz/useQuizLobbyPoll';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudentLobbyState } from '@/app/api/quiz/lobby/route';

// Polling-Wrapper für die Schüler:innen-Wait-Page (Phase S1.C).
// Sobald Lehrer:in "Quiz starten" klickt → status wechselt auf 'active' →
// Wait-Page rendert die "✓ Quiz läuft"-Karte ohne F5.
//
// Wenn das Quiz beendet wird (banner: null) → Redirect zurück zu /s.

type Props = {
  initial: StudentLobbyState;
  moduleTitleInitial: string;
};

export function QuizWaitPolling({ initial, moduleTitleInitial }: Props) {
  const router = useRouter();
  const state = useQuizLobbyPoll(initial);

  useEffect(() => {
    // Quiz weg oder Schüler:in nicht mehr beigetreten → zurück zum Dashboard.
    if (state.kind !== 'student') return;
    if (!state.banner || !state.banner.alreadyJoined) {
      router.push('/s');
    }
  }, [state, router]);

  const banner = state.kind === 'student' ? state.banner : null;
  // Wir nutzen den server-initial-Title bis das erste Polling den
  // (eventuell gleichen) Title liefert.
  const moduleTitle = banner?.moduleTitle ?? moduleTitleInitial;
  const status: 'lobby' | 'active' = banner?.status ?? 'lobby';

  return <WaitView moduleTitle={moduleTitle} status={status} />;
}

function WaitView({ moduleTitle, status }: { moduleTitle: string; status: 'lobby' | 'active' }) {
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
        Du bist beigetreten. Die Seite aktualisiert sich automatisch.
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
