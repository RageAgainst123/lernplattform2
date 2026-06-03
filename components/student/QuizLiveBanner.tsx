'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { joinQuizSession } from '@/lib/db/quiz-participant-actions';
import { Button } from '@/components/ui/button';

// Banner auf dem Schüler:innen-Dashboard (Phase S1.E).
// Wird gerendert wenn eine Quiz-Session der Klasse läuft (status 'lobby'
// oder 'active'). Klick auf „Beitreten" → joinQuizSession → Redirect zur
// Lobby-Wait-Page für die Schüler:in.
//
// Im Team-Modus weiß der Banner nur dass „beigetreten werden kann", die
// Teamname-Form lebt auf einer separaten Route /s/quiz/[sessionId]/team-join
// (siehe S1.E.2 — Team-Beitritt).

type Props = {
  sessionId: string;
  moduleTitle: string;
  teamMode: boolean;
  status: 'lobby' | 'active';
  alreadyJoined: boolean;
};

export function QuizLiveBanner(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { sessionId, moduleTitle, teamMode, status, alreadyJoined } = props;

  function handleJoin() {
    if (teamMode) {
      router.push(`/s/quiz/${sessionId}/team-join`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await joinQuizSession();
      if (res.error || !res.sessionId) {
        setError(res.error ?? 'Beitritt fehlgeschlagen.');
        return;
      }
      router.push(`/s/quiz/${res.sessionId}`);
    });
  }

  return (
    <div className="rounded-lg border-2 border-violet-300 bg-violet-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <BannerHeadline
          moduleTitle={moduleTitle}
          message={bannerMessage(status, teamMode, alreadyJoined)}
        />
        <BannerCta
          status={status}
          alreadyJoined={alreadyJoined}
          pending={pending}
          onJoin={handleJoin}
          onOpen={() => router.push(`/s/quiz/${sessionId}`)}
        />
      </div>
      {error && <BannerError message={error} />}
    </div>
  );
}

function BannerError({ message }: { message: string }) {
  return (
    <p
      className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}

function BannerHeadline({ moduleTitle, message }: { moduleTitle: string; message: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium tracking-wide text-violet-700 uppercase">
        🎮 Live-Klassen-Quiz
      </p>
      <p className="mt-0.5 text-base font-semibold text-violet-950">{moduleTitle}</p>
      <p className="mt-1 text-sm text-violet-800">{message}</p>
    </div>
  );
}

function BannerCta({
  status,
  alreadyJoined,
  pending,
  onJoin,
  onOpen,
}: {
  status: 'lobby' | 'active';
  alreadyJoined: boolean;
  pending: boolean;
  onJoin: () => void;
  onOpen: () => void;
}) {
  if (alreadyJoined) {
    return (
      <Button onClick={onOpen} className="shrink-0 bg-violet-600 hover:bg-violet-700">
        Zur Lobby
      </Button>
    );
  }
  if (status === 'lobby') {
    return (
      <Button
        onClick={onJoin}
        disabled={pending}
        className="shrink-0 bg-violet-600 hover:bg-violet-700"
      >
        {pending ? 'Trete bei…' : 'Beitreten'}
      </Button>
    );
  }
  return (
    <span className="shrink-0 rounded-md bg-violet-200 px-3 py-1.5 text-xs font-medium text-violet-900">
      Läuft schon
    </span>
  );
}

function bannerMessage(
  status: 'lobby' | 'active' | 'between_questions',
  teamMode: boolean,
  alreadyJoined: boolean
): string {
  if (alreadyJoined) {
    return 'Du bist beigetreten. Klick „Zur Lobby" um zu warten.';
  }
  if (status === 'lobby') {
    return teamMode
      ? 'Bildet ein Team — ein:e Spieler:in pro Gruppe meldet sich an und wählt einen Teamnamen.'
      : 'Eure Lehrer:in startet gleich — tritt jetzt bei.';
  }
  return 'Das Quiz läuft bereits. Du kannst aber noch beitreten — verpasste Fragen werden als 0 Punkte gewertet.';
}
