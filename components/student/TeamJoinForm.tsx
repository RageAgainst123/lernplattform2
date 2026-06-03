'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { joinQuizSession } from '@/lib/db/quiz-participant-actions';
import { Button } from '@/components/ui/button';

// Team-Beitritts-Form (Phase S1.E, Spec §7.3). Schüler:in tippt einen
// Teamnamen, ruft joinQuizSession({teamName}) → bei Erfolg Redirect zur
// Lobby-Wait-Page. Server validiert + cappt auf 40 Zeichen + wirft bei
// doppeltem Teamnamen einen freundlichen Fehler.

const TEAM_NAME_MAX = 40;

export function TeamJoinForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) {
      setError('Bitte einen Teamnamen wählen.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await joinQuizSession({ teamName: trimmed });
      if (res.error || !res.sessionId) {
        setError(res.error ?? 'Beitritt fehlgeschlagen.');
        return;
      }
      router.push(`/s/quiz/${res.sessionId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TeamNameField value={teamName} onChange={setTeamName} disabled={pending} />
      {error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || !teamName.trim()} className="w-full">
        {pending ? 'Trete bei…' : '🤝 Team beitreten'}
      </Button>
      {/* sessionId-Round-Trip nicht zwingend nötig (Action liest classId
          aus jose-Session), aber stehen lassen für ggf. spätere ID-Validation. */}
      <input type="hidden" name="session-id" value={sessionId} />
    </form>
  );
}

function TeamNameField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor="team-name" className="text-sm font-medium">
        Euer Teamname
      </label>
      <input
        id="team-name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={TEAM_NAME_MAX}
        placeholder="z.B. Die Codeknacker"
        className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-base"
        autoFocus
        disabled={disabled}
      />
      <p className="text-muted-foreground mt-1 text-xs">
        {value.length}/{TEAM_NAME_MAX} Zeichen — muss in dieser Klasse einzigartig sein.
      </p>
    </div>
  );
}
