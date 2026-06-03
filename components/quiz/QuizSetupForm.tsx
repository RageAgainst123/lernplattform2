'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { createQuizSession } from '@/lib/db/quiz-session-actions';
import type { QuizQuestionRef } from '@/lib/schemas/quiz';
import { Button } from '@/components/ui/button';
import {
  SettingsBlock,
  defaultSettings,
  type SettingsState,
} from '@/components/quiz/QuizSetupSettings';

// Setup-Form für eine Live-Klassen-Quiz-Session (Phase S1.D, Spec §5.2).
// Lehrer:in wählt Zeitlimit + Team-Modus + Shuffle, klickt „Lobby öffnen" →
// createQuizSession-Action → Redirect zur Lobby-Route.
//
// Bei Konflikt (z.B. läuft schon eine Präsentation in der Klasse) → roter
// Fehler-Banner mit Hint wie zu fixen.

type Props = {
  classId: string;
  moduleId: string;
  moduleTitle: string;
  questionOrder: QuizQuestionRef[];
};

export function QuizSetupForm({ classId, moduleId, moduleTitle, questionOrder }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const res = await createQuizSession({
        classId,
        moduleId,
        mode: settings.teamMode ? 'team' : 'live_class',
        questionOrder,
        settings: {
          timeLimitSeconds: settings.timeLimit,
          scoringTimeLimitS: settings.timeLimit,
          teamMode: settings.teamMode,
          showLeaderboardBetween: settings.showLeaderboardBetween,
          shuffleQuestions: settings.shuffleQuestions,
          shuffleAnswers: settings.shuffleAnswers,
          dueDate: null,
        },
      });
      if (res.error || !res.sessionId) {
        setError(res.error ?? 'Quiz konnte nicht gestartet werden.');
        return;
      }
      router.push(`/lehrer/klassen/${classId}/quiz/${moduleId}/run`);
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <SetupHeader moduleTitle={moduleTitle} count={questionOrder.length} />
      {questionOrder.length === 0 ? (
        <NoLiveBlocksHint classId={classId} />
      ) : (
        <SetupBody
          settings={settings}
          setSettings={setSettings}
          error={error}
          pending={pending}
          classId={classId}
          onStart={handleStart}
        />
      )}
    </div>
  );
}

function SetupHeader({ moduleTitle, count }: { moduleTitle: string; count: number }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">🎮 Live-Quiz starten</h1>
      <p className="text-muted-foreground text-sm">
        {moduleTitle} · {count} {count === 1 ? 'Frage' : 'Fragen'}
      </p>
    </header>
  );
}

function SetupBody(props: {
  settings: SettingsState;
  setSettings: (s: SettingsState) => void;
  error: string | null;
  pending: boolean;
  classId: string;
  onStart: () => void;
}) {
  const { settings, setSettings, error, pending, classId, onStart } = props;
  return (
    <>
      <SettingsBlock settings={settings} setSettings={setSettings} />
      {error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/lehrer/klassen/${classId}`}
          className="text-muted-foreground text-sm underline-offset-2 hover:underline"
        >
          Abbrechen
        </Link>
        <Button onClick={onStart} disabled={pending} className="h-11 px-6">
          {pending ? 'Starte…' : '🎮 Lobby öffnen'}
        </Button>
      </div>
    </>
  );
}

function NoLiveBlocksHint({ classId }: { classId: string }) {
  return (
    <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">
        Dieses Modul hat keine live-tauglichen Fragen. Für ein Live-Klassen-Quiz braucht es
        Multiple-Choice, Wahr/Falsch oder Lückentext-Blocks.
      </p>
      <Link
        href={`/lehrer/klassen/${classId}`}
        className="inline-block text-sm font-medium text-amber-900 underline"
      >
        ← Zurück zur Klasse
      </Link>
    </div>
  );
}
