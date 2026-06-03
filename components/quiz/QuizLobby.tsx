'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { endQuizSession, startQuiz } from '@/lib/db/quiz-session-actions';
import { Button } from '@/components/ui/button';

// Beamer-Lobby für eine Live-Klassen-Quiz-Session (Phase S1.D).
// Zeigt die bereits beigetretenen Teilnehmer:innen und lässt die Lehrer:in
// das Quiz starten (Status lobby → active).
//
// In S1.D ist die Teilnehmer:innen-Liste server-seitig static gerendert
// (Refresh per router.refresh()). Echtes Live-Polling kommt in S1.C.

type Participant = {
  studentCodeId: string;
  displayName: string;
  teamName: string | null;
  joinedAt: string;
};

type Props = {
  classId: string;
  moduleTitle: string;
  teamMode: boolean;
  status: 'lobby' | 'active' | 'between_questions';
  participants: Participant[];
};

export function QuizLobby({ classId, moduleTitle, teamMode, status, participants }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const res = await startQuiz(classId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleEnd() {
    if (!confirm('Quiz wirklich abbrechen?')) return;
    setError(null);
    startTransition(async () => {
      const res = await endQuizSession(classId);
      if (res.error) setError(res.error);
      else router.push(`/lehrer/klassen/${classId}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <LobbyHeader moduleTitle={moduleTitle} teamMode={teamMode} />
      <ParticipantPanel
        participants={participants}
        teamMode={teamMode}
        onRefresh={() => router.refresh()}
      />
      {error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      <LobbyActions
        status={status}
        participantCount={participants.length}
        pending={pending}
        onStart={handleStart}
        onEnd={handleEnd}
      />
    </div>
  );
}

function LobbyHeader({ moduleTitle, teamMode }: { moduleTitle: string; teamMode: boolean }) {
  return (
    <header className="space-y-1">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">Live-Quiz</p>
      <h1 className="text-3xl font-semibold">{moduleTitle}</h1>
      {teamMode && (
        <p className="text-sm text-violet-700">
          🤝 Team-Modus — jede Gruppe braucht ein Gerät und wählt einen Teamnamen.
        </p>
      )}
    </header>
  );
}

function LobbyActions({
  status,
  participantCount,
  pending,
  onStart,
  onEnd,
}: {
  status: 'lobby' | 'active' | 'between_questions';
  participantCount: number;
  pending: boolean;
  onStart: () => void;
  onEnd: () => void;
}) {
  const isLobby = status === 'lobby';
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onEnd} disabled={pending}>
        Quiz beenden
      </Button>
      {isLobby ? (
        <Button
          onClick={onStart}
          disabled={pending || participantCount === 0}
          className="h-11 px-6"
        >
          {pending ? 'Starte…' : `▶ Quiz starten (${participantCount})`}
        </Button>
      ) : (
        <span className="text-sm text-emerald-700">
          ✓ Quiz läuft — Frage-Phase folgt in Sprint S2
        </span>
      )}
    </div>
  );
}

function ParticipantPanel({
  participants,
  teamMode,
  onRefresh,
}: {
  participants: Participant[];
  teamMode: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {teamMode ? 'Teams' : 'Teilnehmer:innen'} ({participants.length})
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-muted-foreground text-xs underline-offset-2 hover:underline"
        >
          ↻ Aktualisieren
        </button>
      </div>
      {participants.length === 0 ? (
        <p className="text-muted-foreground text-sm">Warte auf Beitritt…</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <li
              key={p.studentCodeId}
              className="border-input bg-background flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
            >
              <span aria-hidden>{teamMode ? '🤝' : '👤'}</span>
              <span>{p.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
